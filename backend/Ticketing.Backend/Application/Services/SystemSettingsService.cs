using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Ticketing.Backend.Application.DTOs;
using Ticketing.Backend.Domain.Entities;
using Ticketing.Backend.Infrastructure.Data;

namespace Ticketing.Backend.Application.Services;

public interface ISystemSettingsService
{
    Task<SystemSettingsResponse> GetSystemSettingsAsync();
    Task<SystemSettingsResponse> UpdateSystemSettingsAsync(SystemSettingsUpdateRequest request);
}

public class SystemSettingsService : ISystemSettingsService
{
    private readonly AppDbContext _context;

    public SystemSettingsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<SystemSettingsResponse> GetSystemSettingsAsync()
    {
        var settings = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Id == 1);

        if (settings == null)
        {
            // Create default settings if none exist
            settings = new SystemSettings
            {
                Id = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.SystemSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        return MapToResponse(settings);
    }

    public async Task<SystemSettingsResponse> UpdateSystemSettingsAsync(SystemSettingsUpdateRequest request)
    {
        var settings = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Id == 1);

        if (settings == null)
        {
            settings = new SystemSettings
            {
                Id = 1,
                CreatedAt = DateTime.UtcNow
            };
            _context.SystemSettings.Add(settings);
        }

        // Update properties
        settings.AppName = request.AppName;
        settings.SupportEmail = request.SupportEmail;
        settings.SupportPhone = request.SupportPhone;
        settings.DefaultLanguage = request.DefaultLanguage;
        settings.DefaultTheme = request.DefaultTheme;
        settings.Timezone = request.Timezone;

        settings.DefaultPriority = request.DefaultPriority;
        settings.DefaultStatus = request.DefaultStatus;
        settings.ResponseSlaHours = request.ResponseSlaHours;
        settings.AutoAssignEnabled = request.AutoAssignEnabled;
        settings.AllowClientAttachments = request.AllowClientAttachments;
        settings.MaxAttachmentSizeMB = request.MaxAttachmentSizeMB;

        settings.EmailNotificationsEnabled = request.EmailNotificationsEnabled;
        settings.SmsNotificationsEnabled = request.SmsNotificationsEnabled;
        settings.NotifyOnTicketCreated = request.NotifyOnTicketCreated;
        settings.NotifyOnTicketAssigned = request.NotifyOnTicketAssigned;
        settings.NotifyOnTicketReplied = request.NotifyOnTicketReplied;
        settings.NotifyOnTicketClosed = request.NotifyOnTicketClosed;

        settings.PasswordMinLength = request.PasswordMinLength;
        settings.Require2FA = request.Require2FA;
        settings.SessionTimeoutMinutes = request.SessionTimeoutMinutes;

        // Serialize AllowedEmailDomains list to JSON string
        settings.AllowedEmailDomains = JsonSerializer.Serialize(request.AllowedEmailDomains ?? new List<string>());

        settings.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(settings);
    }

    private SystemSettingsResponse MapToResponse(SystemSettings settings)
    {
        // Deserialize AllowedEmailDomains from JSON string
        List<string> allowedDomains = new();
        if (!string.IsNullOrWhiteSpace(settings.AllowedEmailDomains))
        {
            try
            {
                allowedDomains = JsonSerializer.Deserialize<List<string>>(settings.AllowedEmailDomains) ?? new List<string>();
            }
            catch
            {
                // If deserialization fails, use empty list
                allowedDomains = new List<string>();
            }
        }

        return new SystemSettingsResponse
        {
            AppName = settings.AppName,
            SupportEmail = settings.SupportEmail,
            SupportPhone = settings.SupportPhone,
            DefaultLanguage = settings.DefaultLanguage,
            DefaultTheme = settings.DefaultTheme,
            Timezone = settings.Timezone,

            DefaultPriority = settings.DefaultPriority,
            DefaultStatus = settings.DefaultStatus,
            ResponseSlaHours = settings.ResponseSlaHours,
            AutoAssignEnabled = settings.AutoAssignEnabled,
            AllowClientAttachments = settings.AllowClientAttachments,
            MaxAttachmentSizeMB = settings.MaxAttachmentSizeMB,

            EmailNotificationsEnabled = settings.EmailNotificationsEnabled,
            SmsNotificationsEnabled = settings.SmsNotificationsEnabled,
            NotifyOnTicketCreated = settings.NotifyOnTicketCreated,
            NotifyOnTicketAssigned = settings.NotifyOnTicketAssigned,
            NotifyOnTicketReplied = settings.NotifyOnTicketReplied,
            NotifyOnTicketClosed = settings.NotifyOnTicketClosed,

            PasswordMinLength = settings.PasswordMinLength,
            Require2FA = settings.Require2FA,
            SessionTimeoutMinutes = settings.SessionTimeoutMinutes,
            AllowedEmailDomains = allowedDomains
        };
    }
}

