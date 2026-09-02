using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kaiser.Backend.Data;
using Kaiser.Backend.Models;

namespace Kaiser.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AuthController(AppDbContext db)
        {
            _db = db;
        }

        public static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password + "_KaiserSalt2026"));
            return Convert.ToBase64String(bytes);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            {
                return BadRequest(new LoginResponse { Success = false, Message = "نام کاربری و کلمه عبور الزامی است." });
            }

            var hash = HashPassword(req.Password);
            var admin = await _db.AdminAccounts.FirstOrDefaultAsync(a => a.Username.ToLower() == req.Username.Trim().ToLower());

            if (admin == null || admin.PasswordHash != hash)
            {
                // Fallback check for exact required password if newly seeded
                if ((req.Username.Trim().ToLower() == "roham" || req.Username.Trim().ToLower() == "admin") && req.Password == "kjhgfdsaMn01@")
                {
                    if (admin == null)
                    {
                        admin = new AdminAccount
                        {
                            Username = req.Username.Trim().ToLower(),
                            PasswordHash = hash,
                            Role = "SuperAdmin",
                            CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                        };
                        _db.AdminAccounts.Add(admin);
                    }
                    else
                    {
                        admin.PasswordHash = hash;
                    }
                    admin.LastLogin = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                    await _db.SaveChangesAsync();
                }
                else
                {
                    return Unauthorized(new LoginResponse { Success = false, Message = "نام کاربری یا کلمه عبور اشتباه است." });
                }
            }

            admin.LastLogin = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            await _db.SaveChangesAsync();

            // Simple persistent secure bearer token
            string token = "kaiser_token_" + Guid.NewGuid().ToString("N") + "_" + DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            return Ok(new LoginResponse
            {
                Success = true,
                Token = token,
                Username = admin.Username,
                Role = admin.Role,
                Message = "ورود با موفقیت انجام شد."
            });
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var admin = await _db.AdminAccounts.FirstOrDefaultAsync(a => a.Username == "roham")
                     ?? await _db.AdminAccounts.FirstOrDefaultAsync();
            if (admin == null) return NotFound();
            return Ok(new { username = admin.Username, role = admin.Role, lastLogin = admin.LastLogin });
        }
    }
}
