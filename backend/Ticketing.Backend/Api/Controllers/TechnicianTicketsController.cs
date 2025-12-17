using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.Backend.Application.Services;
using Ticketing.Backend.Domain.Enums;

namespace Ticketing.Backend.Api.Controllers;

[ApiController]
[Route("api/technician")]
[Authorize]
public class TechnicianTicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly ILogger<TechnicianTicketsController> _logger;

    public TechnicianTicketsController(ITicketService ticketService, ILogger<TechnicianTicketsController> logger)
    {
        _ticketService = ticketService;
        _logger = logger;
    }

    private Guid? GetCurrentUserId()
    {
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(idValue, out var userId))
        {
            return userId;
        }
        return null;
    }

    /// <summary>
    /// Get tickets assigned to the current technician
    /// </summary>
    [HttpGet("tickets")]
    [Authorize(Roles = nameof(UserRole.Technician))]
    public async Task<IActionResult> GetMyTickets()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var tickets = await _ticketService.GetTicketsAsync(
            userId.Value,
            UserRole.Technician,
            status: null,
            priority: null,
            assignedTo: null,
            createdBy: null,
            search: null
        );

        return Ok(tickets);
    }
}

