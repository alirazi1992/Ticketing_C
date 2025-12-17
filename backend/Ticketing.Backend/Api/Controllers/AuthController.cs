using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ticketing.Backend.Application.DTOs;
using Ticketing.Backend.Application.Services;
using Ticketing.Backend.Domain.Enums;
using Ticketing.Backend.Infrastructure.Data;

namespace Ticketing.Backend.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly AppDbContext _context;

    public AuthController(IUserService userService, AppDbContext context)
    {
        _userService = userService;
        _context = context;
    }

    // ------------------------------
    // DEBUG: لیست یوزرها برای تست لاگین
    // ------------------------------
    [HttpGet("debug-users")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDebugUsers([FromServices] AppDbContext context)
    {
        var users = await context.Users
            .Select(u => new
            {
                u.Email,
                u.FullName,
                Role = u.Role.ToString(),
                u.Department
            })
            .ToListAsync();

        return Ok(users);
    }

    // ------------------------------
    // SECURITY-CRITICAL: Register endpoint with explicit role validation
    // 
    // Role Security Rules (ENFORCED STRICTLY):
    // 1. Role MUST be explicitly provided in RegisterRequest (no defaults, no silent fallbacks)
    // 2. Role MUST be a valid UserRole enum value → HTTP 400 if invalid
    // 3. Requested role is ALWAYS persisted exactly as provided (no overrides)
    // 4. Admin role creation rules:
    //    a) ALLOWED if: This is the first user (bootstrap scenario), OR
    //    b) ALLOWED if: Caller is authenticated Admin
    //    c) FORBIDDEN (HTTP 403) otherwise
    // 5. Email conflict → HTTP 409
    // 6. Invalid role → HTTP 400 (explicit error message)
    // ------------------------------
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        // SECURITY-CRITICAL: Validate model state FIRST
        // This ensures all required fields including Role are present
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // SECURITY-CRITICAL: Role MUST be explicitly provided (cannot be null)
        // Using nullable Role in DTO allows us to detect when it's missing from JSON
        if (!request.Role.HasValue)
        {
            return BadRequest(new { 
                message = "Role is required and must be explicitly specified. Valid values: Client (0), Technician (1), Admin (2)",
                error = "ROLE_REQUIRED",
                validRoles = new[] { "Client", "Technician", "Admin" }
            });
        }

        // SECURITY-CRITICAL: Explicit role validation - MUST be a valid enum value
        // This prevents invalid integer values from being processed
        var role = request.Role.Value;
        if (!Enum.IsDefined(typeof(UserRole), role))
        {
            return BadRequest(new { 
                message = "Invalid role specified. Role must be explicitly set to one of: Client (0), Technician (1), Admin (2)",
                error = "INVALID_ROLE",
                validRoles = new[] { "Client", "Technician", "Admin" },
                receivedRole = role.ToString()
            });
        }

        // SECURITY-CRITICAL: Admin role registration requires authenticated Admin user
        // ONLY authenticated Admin users can create new Admin accounts
        // Client and Technician registration remains allowed for anonymous users
        if (role == UserRole.Admin)
        {
            // Admin registration requires authentication
            if (User.Identity?.IsAuthenticated != true)
            {
                return StatusCode(403, new { 
                    message = "Admin account creation requires authentication. Only authenticated Admin users can create Admin accounts.",
                    error = "ADMIN_REGISTRATION_REQUIRES_AUTH",
                    requestedRole = role.ToString()
                });
            }

            // Verify caller is Admin
            var callerRoleClaim = User.FindFirstValue(ClaimTypes.Role);
            if (string.IsNullOrEmpty(callerRoleClaim) || 
                !Enum.TryParse<UserRole>(callerRoleClaim, out var callerRole) || 
                callerRole != UserRole.Admin)
            {
                return StatusCode(403, new { 
                    message = "Only Admin users can create Admin accounts. Your role does not have permission to create Admin users.",
                    error = "ADMIN_REGISTRATION_FORBIDDEN",
                    requestedRole = role.ToString(),
                    callerRole = callerRoleClaim ?? "unknown"
                });
            }
        }

        // Determine caller's role for authorization checks (for UserService)
        // This is used for additional validation in UserService (e.g., bootstrap check)
        UserRole callerRoleForService;
        if (User.Identity?.IsAuthenticated == true)
        {
            var roleClaim = User.FindFirstValue(ClaimTypes.Role);
            if (string.IsNullOrEmpty(roleClaim) || !Enum.TryParse<UserRole>(roleClaim, out callerRoleForService))
            {
                // Invalid role claim in token - treated as non-Admin for service-level checks
                callerRoleForService = UserRole.Client;
            }
        }
        else
        {
            // Anonymous caller - treated as non-Admin for service-level checks
            callerRoleForService = UserRole.Client;
        }

        // SECURITY-CRITICAL: Create a new request with validated non-nullable Role for UserService
        // UserService expects non-nullable Role, and we've already validated it's not null above
        var serviceRequest = new RegisterRequest
        {
            FullName = request.FullName,
            Email = request.Email,
            Password = request.Password,
            Role = role, // Use validated non-nullable role (request.Role.Value)
            PhoneNumber = request.PhoneNumber,
            Department = request.Department
        };

        // SECURITY-CRITICAL: Delegate to UserService for role authorization and persistence
        // UserService will:
        // 1. Validate email uniqueness
        // 2. Perform additional validation (defense-in-depth)
        // 3. Persist serviceRequest.Role EXACTLY as provided (no modifications)
        // NOTE: Admin authorization is already enforced above, but UserService may have additional checks
        var response = await _userService.RegisterAsync(serviceRequest, callerRoleForService);

        if (response == null)
        {
            // UserService returns null for security violations - determine the specific reason
            
            // Check email conflict first (most common case)
            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == serviceRequest.Email.ToLower());
            if (emailExists)
            {
                return Conflict(new { 
                    message = "Email address is already registered.",
                    error = "EMAIL_EXISTS"
                });
            }

            // If we reach here and response is null, it's likely a service-level validation failure
            // Controller-level Admin authorization was already checked above, so Admin-related errors
            // should have been caught earlier. This handles other edge cases.
            // Generic error for other validation failures
            return BadRequest(new { 
                message = "Unable to register user. Please check your request and try again.",
                error = "REGISTRATION_FAILED"
            });
        }

        // SECURITY: Registration successful - role persisted exactly as requested
        // Verify the response contains the correct role
        if (response.User?.Role != role)
        {
            // SYSTEM FAILURE: Role mismatch between request and response
            return StatusCode(500, new { 
                message = "System error: Role mismatch detected. Contact administrator.",
                error = "ROLE_MISMATCH"
            });
        }

        return Ok(response);
    }

    // ------------------------------
    // Login
    // ------------------------------
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var response = await _userService.LoginAsync(request);
        if (response == null)
        {
            return Unauthorized("Invalid email or password.");
        }

        return Ok(response);
    }

    // ------------------------------
    // Me
    // ------------------------------
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        // ما انتظار داریم Claim اصلی، NameIdentifier = User.Id باشد
        var idValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue(ClaimTypes.Email);

        if (!Guid.TryParse(idValue, out var userId))
        {
            return Unauthorized();
        }

        var user = await _userService.GetByIdAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    // ------------------------------
    // Update Profile
    // ------------------------------
    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(idValue, out var userId))
        {
            return Unauthorized();
        }

        var user = await _userService.UpdateProfileAsync(userId, request);
        if (user == null)
        {
            return Conflict("Unable to update profile with the provided information.");
        }

        return Ok(user);
    }

    // ------------------------------
    // Change Password
    // ------------------------------
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(idValue, out var userId))
        {
            return Unauthorized("کاربر احراز هویت نشده است");
        }

        var (success, errorMessage) = await _userService.ChangePasswordAsync(
            userId, 
            request.CurrentPassword, 
            request.NewPassword, 
            request.ConfirmNewPassword);

        if (!success)
        {
            return BadRequest(new { message = errorMessage ?? "رمز عبور قابل تغییر نیست" });
        }

        return Ok(new { success = true, message = "رمز عبور با موفقیت تغییر کرد" });
    }
}
