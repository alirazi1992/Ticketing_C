using Microsoft.EntityFrameworkCore;
using Ticketing.Backend.Application.DTOs;
using Ticketing.Backend.Domain.Entities;
using Ticketing.Backend.Domain.Enums;
using Ticketing.Backend.Infrastructure.Data;

namespace Ticketing.Backend.Application.Services;

/// <summary>
/// Thrown when a user attempts a status change they don't have permission for
/// </summary>
public class StatusChangeForbiddenException : Exception
{
    public StatusChangeForbiddenException(string message) : base(message) { }
}

public interface ITicketService
{
    Task<IEnumerable<TicketResponse>> GetTicketsAsync(Guid userId, UserRole role, TicketStatus? status, TicketPriority? priority, Guid? assignedTo, Guid? createdBy, string? search);
    Task<TicketResponse?> GetTicketAsync(Guid id, Guid userId, UserRole role);
    Task<TicketResponse?> CreateTicketAsync(Guid userId, TicketCreateRequest request);
    Task<TicketResponse?> UpdateTicketAsync(Guid id, Guid userId, UserRole role, TicketUpdateRequest request);
    Task<TicketResponse?> AssignTicketAsync(Guid id, Guid technicianId);
    Task<IEnumerable<TicketMessageDto>> GetMessagesAsync(Guid ticketId, Guid userId, UserRole role);
    Task<TicketMessageDto?> AddMessageAsync(Guid ticketId, Guid authorId, string message, TicketStatus? status = null);
    Task<IEnumerable<TicketCalendarResponse>> GetCalendarTicketsAsync(DateTime startDate, DateTime endDate);
}

public class TicketService : ITicketService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ITechnicianService _technicianService;
    private readonly ISystemSettingsService _systemSettingsService;
    private readonly ISmartAssignmentService _smartAssignmentService;

    public TicketService(
        AppDbContext context, 
        INotificationService notificationService, 
        ITechnicianService technicianService,
        ISystemSettingsService systemSettingsService,
        ISmartAssignmentService smartAssignmentService)
    {
        _context = context;
        _notificationService = notificationService;
        _technicianService = technicianService;
        _systemSettingsService = systemSettingsService;
        _smartAssignmentService = smartAssignmentService;
    }

    public async Task<IEnumerable<TicketResponse>> GetTicketsAsync(Guid userId, UserRole role, TicketStatus? status, TicketPriority? priority, Guid? assignedTo, Guid? createdBy, string? search)
    {
        // Start building a query with all the relationships we need for mapping
        var query = _context.Tickets
            .Include(t => t.Category)
            .Include(t => t.Subcategory)
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Technician)
            .AsQueryable();

        // Restrict tickets based on role
        query = role switch
        {
            UserRole.Client => query.Where(t => t.CreatedByUserId == userId),
            UserRole.Technician => query.Where(t => t.TechnicianId == userId || t.AssignedToUserId == userId),
            _ => query
        };

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }
        if (priority.HasValue)
        {
            query = query.Where(t => t.Priority == priority.Value);
        }
        if (assignedTo.HasValue)
        {
            query = query.Where(t => t.AssignedToUserId == assignedTo.Value);
        }
        if (createdBy.HasValue)
        {
            query = query.Where(t => t.CreatedByUserId == createdBy.Value);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(t => t.Title.Contains(search) || t.Description.Contains(search));
        }

        var tickets = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return tickets.Select(MapToResponse);
    }

    public async Task<TicketResponse?> GetTicketAsync(Guid id, Guid userId, UserRole role)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Category)
            .Include(t => t.Subcategory)
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Technician)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return null;
        }

        if (role == UserRole.Client && ticket.CreatedByUserId != userId)
        {
            return null;
        }

        if (role == UserRole.Technician && ticket.TechnicianId != userId && ticket.AssignedToUserId != userId)
        {
            return null;
        }

        return MapToResponse(ticket);
    }

    public async Task<TicketResponse?> CreateTicketAsync(Guid userId, TicketCreateRequest request)
    {
        // Clients create tickets for themselves; the role check happens in the controller
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            CategoryId = request.CategoryId,
            SubcategoryId = request.SubcategoryId,
            Priority = request.Priority,
            Status = TicketStatus.New,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        // NOTE: Auto-assignment on ticket creation is DISABLED by design.
        // Tickets are always created as New + unassigned.
        // Smart Assignment runs manually via POST /api/admin/assignment/smart/run
        // or can be scheduled externally. This ensures predictable ticket state.

        ticket = await _context.Tickets
            .Include(t => t.Category)
            .Include(t => t.Subcategory)
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Technician)
            .FirstAsync(t => t.Id == ticket.Id);

        return MapToResponse(ticket);
    }

    public async Task<TicketResponse?> UpdateTicketAsync(Guid id, Guid userId, UserRole role, TicketUpdateRequest request)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null)
        {
            return null;
        }

        // Validate permission rules
        if (role == UserRole.Client && ticket.CreatedByUserId != userId)
        {
            return null;
        }
        if (role == UserRole.Technician && ticket.TechnicianId != userId && ticket.AssignedToUserId != userId)
        {
            return null;
        }

        if (request.Description != null && role != UserRole.Technician)
        {
            ticket.Description = request.Description;
        }

        if (request.Priority.HasValue && role != UserRole.Technician)
        {
            ticket.Priority = request.Priority.Value;
        }

        if (request.Status.HasValue)
        {
            if (role == UserRole.Client)
            {
                // Clients can only close or set waiting for client on their own tickets
                if (request.Status is TicketStatus.WaitingForClient or TicketStatus.Closed)
                {
                    ticket.Status = request.Status.Value;
                }
            }
            else if (role == UserRole.Technician)
            {
                ticket.Status = request.Status.Value;
            }
            else
            {
                ticket.Status = request.Status.Value;
            }
        }

        if (role == UserRole.Admin)
        {
            if (request.AssignedToUserId.HasValue)
            {
                ticket.AssignedToUserId = request.AssignedToUserId.Value;
            }
            ticket.DueDate = request.DueDate;
        }

        ticket.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetTicketAsync(id, userId, role);
    }

    public async Task<TicketResponse?> AssignTicketAsync(Guid id, Guid technicianId)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null)
        {
            return null;
        }

        // Load technician to get UserId (required for AssignedToUserId foreign key)
        var technician = await _context.Technicians
            .FirstOrDefaultAsync(t => t.Id == technicianId);
        
        if (technician == null || !technician.IsActive)
        {
            return null; // Technician not found or inactive
        }

        // Set both TechnicianId (for display/navigation) and AssignedToUserId (for filtering/queries)
        ticket.TechnicianId = technicianId;
        ticket.AssignedToUserId = technician.UserId; // CRITICAL: Set to Technician.UserId (User.Id), not null
        ticket.Status = TicketStatus.InProgress;
        ticket.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetTicketAsync(id, Guid.Empty, UserRole.Admin);
    }

    public async Task<IEnumerable<TicketMessageDto>> GetMessagesAsync(Guid ticketId, Guid userId, UserRole role)
    {
        var ticket = await GetTicketAsync(ticketId, userId, role);
        if (ticket == null)
        {
            return Enumerable.Empty<TicketMessageDto>();
        }

        return await _context.TicketMessages
            .Include(m => m.AuthorUser)
            .Where(m => m.TicketId == ticketId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new TicketMessageDto
            {
                Id = m.Id,
                AuthorUserId = m.AuthorUserId,
                AuthorName = m.AuthorUser!.FullName,
                AuthorEmail = m.AuthorUser.Email,
                Message = m.Message,
                CreatedAt = m.CreatedAt,
                Status = m.Status
            })
            .ToListAsync();
    }

    public async Task<TicketMessageDto?> AddMessageAsync(Guid ticketId, Guid authorId, string message, TicketStatus? status = null)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId);
        if (ticket == null)
        {
            return null;
        }

        var author = await _context.Users.FirstOrDefaultAsync(u => u.Id == authorId);
        if (author == null)
        {
            return null;
        }

        // Access control: Client can only access their own tickets
        if (author.Role == UserRole.Client && ticket.CreatedByUserId != authorId)
        {
            return null;
        }

        // Access control: Technician can only access assigned tickets
        if (author.Role == UserRole.Technician && ticket.TechnicianId != authorId && ticket.AssignedToUserId != authorId)
        {
            return null;
        }

        // ═══════════════════════════════════════════════════════════════════════════════
        // STATUS CHANGE PERMISSION RULES (SECURITY-CRITICAL)
        // ═══════════════════════════════════════════════════════════════════════════════
        // CLOSE (Resolved/Closed): Technician & Admin ONLY - Client FORBIDDEN
        // REOPEN (InProgress from Resolved/Closed): All roles allowed
        // Other status changes: Technician & Admin only
        // ═══════════════════════════════════════════════════════════════════════════════
        if (status.HasValue)
        {
            var newStatus = status.Value;
            var isClosingStatus = newStatus == TicketStatus.Resolved || newStatus == TicketStatus.Closed;
            var isReopening = newStatus == TicketStatus.InProgress && 
                              (ticket.Status == TicketStatus.Resolved || ticket.Status == TicketStatus.Closed);

            if (author.Role == UserRole.Client)
            {
                // Client can REOPEN (set InProgress on resolved/closed ticket)
                // Client can set WaitingForClient (waiting for themselves - edge case but allowed)
                // Client CANNOT close tickets (Resolved or Closed)
                if (isClosingStatus)
                {
                    // FORBIDDEN: Client cannot close tickets - throw exception for controller to handle
                    throw new StatusChangeForbiddenException("Clients cannot close tickets. Only Technicians and Admins can set status to Resolved or Closed.");
                }

                // Client can only set: InProgress (reopen), WaitingForClient
                if (isReopening || newStatus == TicketStatus.WaitingForClient)
                {
                    ticket.Status = newStatus;
                }
                // Other status changes by Client are silently ignored (no error, just don't apply)
            }
            else
            {
                // Technician & Admin can set any status
                ticket.Status = newStatus;
            }
        }

        ticket.UpdatedAt = DateTime.UtcNow;

        var ticketMessage = new TicketMessage
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            AuthorUserId = authorId,
            Message = message,
            CreatedAt = DateTime.UtcNow,
            Status = status ?? ticket.Status
        };

        _context.TicketMessages.Add(ticketMessage);
        await _context.SaveChangesAsync();

        // Notify opposite participant
        var notifyUserId = ticket.AssignedToUserId == authorId ? ticket.CreatedByUserId : ticket.AssignedToUserId ?? ticket.CreatedByUserId;
        await _notificationService.CreateNotificationAsync(notifyUserId, $"New message on ticket '{ticket.Title}'");

        return await _context.TicketMessages
            .Include(m => m.AuthorUser)
            .Where(m => m.Id == ticketMessage.Id)
            .Select(m => new TicketMessageDto
            {
                Id = m.Id,
                AuthorUserId = m.AuthorUserId,
                AuthorName = m.AuthorUser!.FullName,
                AuthorEmail = m.AuthorUser.Email,
                Message = m.Message,
                CreatedAt = m.CreatedAt,
                Status = m.Status
            })
            .FirstAsync();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // MANUAL TEST CHECKLIST (Swagger):
    // 1. POST /api/Tickets → status=New, assignedToUserId=null, assignedToName/email/phone=null
    // 2. POST /api/admin/assignment/smart/run → assignedCount > 0 (if eligible unassigned tickets exist)
    // 3. GET /api/technician/tickets (as assigned tech) → ticket appears in list
    // ═══════════════════════════════════════════════════════════════════════════════
    private static TicketResponse MapToResponse(Ticket ticket)
    {
        // SECURITY-CRITICAL: Only show assigned technician info when ticket is truly assigned
        // "Truly assigned" = AssignedToUserId is not null (the authoritative field for filtering/queries)
        var isAssigned = ticket.AssignedToUserId != null;
        
        return new TicketResponse
        {
            Id = ticket.Id,
            Title = ticket.Title,
            Description = ticket.Description,
            CategoryId = ticket.CategoryId,
            CategoryName = ticket.Category?.Name ?? string.Empty,
            SubcategoryId = ticket.SubcategoryId,
            SubcategoryName = ticket.Subcategory?.Name,
            Priority = ticket.Priority,
            Status = ticket.Status,
            CreatedByUserId = ticket.CreatedByUserId,
            CreatedByName = ticket.CreatedByUser?.FullName ?? string.Empty,
            CreatedByEmail = ticket.CreatedByUser?.Email ?? string.Empty,
            CreatedByPhoneNumber = ticket.CreatedByUser?.PhoneNumber,
            CreatedByDepartment = ticket.CreatedByUser?.Department,
            AssignedToUserId = ticket.AssignedToUserId,
            // Only populate assigned fields when truly assigned
            AssignedToName = isAssigned ? (ticket.Technician?.FullName ?? ticket.AssignedToUser?.FullName) : null,
            AssignedToEmail = isAssigned ? (ticket.Technician?.Email ?? ticket.AssignedToUser?.Email) : null,
            AssignedToPhoneNumber = isAssigned ? (ticket.Technician?.Phone ?? ticket.AssignedToUser?.PhoneNumber) : null,
            AssignedTechnicianName = isAssigned ? (ticket.Technician?.FullName ?? ticket.AssignedToUser?.FullName) : null,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt,
            DueDate = ticket.DueDate
        };
    }

    public async Task<IEnumerable<TicketCalendarResponse>> GetCalendarTicketsAsync(DateTime startDate, DateTime endDate)
    {
        // Get all tickets within the date range (Admin only - no role filtering)
        var tickets = await _context.Tickets
            .Include(t => t.Category)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Technician)
            .Where(t => t.CreatedAt >= startDate && t.CreatedAt <= endDate)
            .OrderBy(t => t.CreatedAt)
            .ToListAsync();

        return tickets.Select(t => new TicketCalendarResponse
        {
            Id = t.Id,
            TicketNumber = $"T-{t.Id.ToString("N").Substring(0, 8).ToUpper()}",
            Title = t.Title,
            Status = t.Status,
            Priority = t.Priority,
            CategoryName = t.Category?.Name ?? string.Empty,
            // Only show technician name when truly assigned (AssignedToUserId != null)
            AssignedTechnicianName = t.AssignedToUserId != null ? (t.Technician?.FullName ?? t.AssignedToUser?.FullName) : null,
            CreatedAt = t.CreatedAt,
            DueDate = t.DueDate
        });
    }
}
