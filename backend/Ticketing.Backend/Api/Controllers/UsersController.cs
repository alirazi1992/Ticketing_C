using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.Backend.Application.DTOs;
using Ticketing.Backend.Application.Services;
using Ticketing.Backend.Domain.Enums;

namespace Ticketing.Backend.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IUserPreferencesService _preferencesService;

    public UsersController(IUserService userService, IUserPreferencesService preferencesService)
    {
        _userService = userService;
        _preferencesService = preferencesService;
    }

    [HttpGet]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userService.GetAllAsync();
        return Ok(users);
    }

    [HttpGet("technicians")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> GetTechnicians()
    {
        var users = await _userService.GetTechniciansAsync();
        return Ok(users);
    }

    /// <summary>
    /// Get current user's preferences
    /// </summary>
    /// <returns>User preferences including theme, language, font size, and notification settings</returns>
    /// <response code="200">Returns user preferences</response>
    /// <response code="401">Unauthorized - user not authenticated</response>
    [HttpGet("me/preferences")]
    [Authorize]
    [ProducesResponseType(typeof(UserPreferencesResponse), 200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<UserPreferencesResponse>> GetMyPreferences()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var preferences = await _preferencesService.GetPreferencesAsync(userId.Value);
        return Ok(preferences);
    }

    /// <summary>
    /// Update current user's preferences
    /// </summary>
    /// <param name="request">Preferences update request with theme, language, and font size</param>
    /// <returns>Updated user preferences</returns>
    /// <response code="200">Preferences updated successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="401">Unauthorized - user not authenticated</response>
    [HttpPut("me/preferences")]
    [Authorize]
    [ProducesResponseType(typeof(UserPreferencesResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<UserPreferencesResponse>> UpdateMyPreferences([FromBody] UserPreferencesUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var preferences = await _preferencesService.UpdatePreferencesAsync(userId.Value, request);
        return Ok(preferences);
    }

    /// <summary>
    /// Get current user's notification preferences
    /// </summary>
    [HttpGet("me/notifications")]
    [Authorize]
    public async Task<ActionResult<NotificationPreferencesResponse>> GetMyNotificationPreferences()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var preferences = await _preferencesService.GetNotificationPreferencesAsync(userId.Value);
        return Ok(preferences);
    }

    /// <summary>
    /// Update current user's notification preferences
    /// </summary>
    [HttpPut("me/notifications")]
    [Authorize]
    public async Task<ActionResult<NotificationPreferencesResponse>> UpdateMyNotificationPreferences([FromBody] NotificationPreferencesUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var preferences = await _preferencesService.UpdateNotificationPreferencesAsync(userId.Value, request);
        return Ok(preferences);
    }

    private Guid? GetCurrentUserId()
    {
        // Try multiple claim types to find user ID (same logic as AuthController)
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier) 
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub")
            ?? User.FindFirstValue(ClaimTypes.Email);
        
        if (string.IsNullOrEmpty(idValue))
        {
            return null;
        }
        
        if (Guid.TryParse(idValue, out var userId))
        {
            return userId;
        }
        return null;
    }
}
