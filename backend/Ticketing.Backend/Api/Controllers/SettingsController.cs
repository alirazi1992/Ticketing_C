using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.Backend.Application.DTOs;
using Ticketing.Backend.Application.Services;
using Ticketing.Backend.Domain.Enums;

namespace Ticketing.Backend.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly ISystemSettingsService _systemSettingsService;

    public SettingsController(ISystemSettingsService systemSettingsService)
    {
        _systemSettingsService = systemSettingsService;
    }

    /// <summary>
    /// Get current system settings
    /// </summary>
    [HttpGet("system")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<SystemSettingsResponse>> GetSystemSettings()
    {
        var settings = await _systemSettingsService.GetSystemSettingsAsync();
        return Ok(settings);
    }

    /// <summary>
    /// Update system settings (Admin only)
    /// </summary>
    [HttpPut("system")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<SystemSettingsResponse>> UpdateSystemSettings([FromBody] SystemSettingsUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var updatedSettings = await _systemSettingsService.UpdateSystemSettingsAsync(request);
            return Ok(updatedSettings);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "خطا در به‌روزرسانی تنظیمات سیستم", error = ex.Message });
        }
    }
}

