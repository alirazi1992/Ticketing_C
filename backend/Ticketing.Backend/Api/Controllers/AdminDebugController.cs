// ⚠️ TEMPORARY DEBUG CONTROLLER - REMOVE BEFORE PRODUCTION ⚠️
// This controller exposes internal data for debugging purposes only.

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ticketing.Backend.Domain.Enums;
using Ticketing.Backend.Infrastructure.Data;

namespace Ticketing.Backend.Api.Controllers;

[ApiController]
[Route("api/admin/debug")]
[Authorize(Roles = nameof(UserRole.Admin))]
public class AdminDebugController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<AdminDebugController> _logger;

    public AdminDebugController(AppDbContext context, ILogger<AdminDebugController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// ⚠️ DEBUG ONLY: List all users in the database
    /// Returns { id, email, role } for each user to verify DB consistency.
    /// REMOVE THIS ENDPOINT BEFORE PRODUCTION.
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        _logger.LogWarning("DEBUG ENDPOINT CALLED: GET /api/admin/debug/users - This should be removed before production");

        var users = await _context.Users
            .AsNoTracking()
            .OrderBy(u => u.Email)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FullName,
                Role = u.Role.ToString(),
                u.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount = users.Count,
            databasePath = _context.Database.GetDbConnection().ConnectionString,
            users
        });
    }

    /// <summary>
    /// ⚠️ DEBUG ONLY: List all technicians with their linked User IDs
    /// REMOVE THIS ENDPOINT BEFORE PRODUCTION.
    /// </summary>
    [HttpGet("technicians")]
    public async Task<IActionResult> GetAllTechniciansDebug()
    {
        _logger.LogWarning("DEBUG ENDPOINT CALLED: GET /api/admin/debug/technicians - This should be removed before production");

        var technicians = await _context.Technicians
            .AsNoTracking()
            .OrderBy(t => t.Email)
            .Select(t => new
            {
                TechnicianId = t.Id,
                t.Email,
                t.FullName,
                LinkedUserId = t.UserId,
                t.IsActive
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount = technicians.Count,
            linkedCount = technicians.Count(t => t.LinkedUserId != null),
            unlinkedCount = technicians.Count(t => t.LinkedUserId == null),
            technicians
        });
    }
}


