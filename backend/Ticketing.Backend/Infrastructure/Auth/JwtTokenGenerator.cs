using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Ticketing.Backend.Domain.Entities;
using Ticketing.Backend.Domain.Enums;

namespace Ticketing.Backend.Infrastructure.Auth;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly JwtSettings _settings;

    public JwtTokenGenerator(JwtSettings settings)
    {
        _settings = settings;
    }

    /// <summary>
    /// SECURITY-CRITICAL: Generates JWT token with role claim from persisted user role
    /// 
    /// Role Claim Rules (ENFORCED STRICTLY):
    /// 1. Role claim is ALWAYS derived from user.Role (persisted database value)
    /// 2. NEVER hardcodes roles (no "Client", "Admin", etc. as string literals)
    /// 3. NEVER applies defaults (no fallback to Client or any role)
    /// 4. Uses user.Role.ToString() to get exact enum string representation
    /// 
    /// CRITICAL: This method trusts the database - user.Role must be valid when persisted
    /// </summary>
    public string GenerateToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        // SECURITY-CRITICAL: Role claim is ALWAYS from persisted user.Role
        // NO hardcoding, NO defaults, NO modifications
        // user.Role comes from database and was persisted exactly as requested during registration
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()), // EXACT role from database - no modifications, no hardcoding
            new("name", user.FullName)
        };

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.ExpirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
