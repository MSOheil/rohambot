using Microsoft.EntityFrameworkCore;
using Kaiser.Backend.Controllers;
using Kaiser.Backend.Models;
using Kaiser.Backend.Services;

namespace Kaiser.Backend.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            var isPostgres = context.Database.IsNpgsql();
            var dbProvider = isPostgres ? "PostgreSQL" : "SQLite";

            KaiserLogger.Database($"Checking database connection ({dbProvider})...");

            // 1. Ensure Table Schema Creation
            try
            {
                if (context.Database.IsSqlite())
                {
                    context.Database.ExecuteSqlRaw(@"
                        CREATE TABLE IF NOT EXISTS AdminAccounts (
                            Id INTEGER PRIMARY KEY AUTOINCREMENT,
                            Username TEXT NOT NULL,
                            PasswordHash TEXT NOT NULL,
                            Role TEXT NOT NULL,
                            CreatedAt INTEGER NOT NULL,
                            LastLogin INTEGER NOT NULL
                        );
                    ");
                }
                else
                {
                    context.Database.EnsureCreated();
                }
                KaiserLogger.Database($"✅ Database connection established and tables verified ({dbProvider})", new { provider = dbProvider });
            }
            catch (Exception ex)
            {
                KaiserLogger.Database($"❌ Database schema initialization failed on {dbProvider}: {ex.Message}", new { error = ex.Message }, false);
            }

            // 2. Seed Super Admin account (admin / kjhgfdsaMn01@)
            try
            {
                var admin = context.AdminAccounts.FirstOrDefault(a => a.Username == "admin");
                if (admin == null)
                {
                    context.AdminAccounts.Add(new AdminAccount
                    {
                        Username = "admin",
                        PasswordHash = AuthController.HashPassword("kjhgfdsaMn01@"),
                        Role = "SuperAdmin",
                        CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                    });
                    context.SaveChanges();
                    KaiserLogger.Success("SuperAdmin account seeded successfully (Username: admin)", null, "AUTH");
                }
                else
                {
                    KaiserLogger.Info("SuperAdmin account verified (Username: admin)", null, "AUTH");
                }
            }
            catch (Exception ex)
            {
                KaiserLogger.Error("Error checking SuperAdmin account", ex, "AUTH");
            }

            // 3. Seed default settings if not exists
            try
            {
                if (!context.Settings.Any())
                {
                    context.Settings.Add(new Setting
                    {
                        Id = 1,
                        Status = 1,
                        LockChanel = "namahdoodnet",
                        CardToCard = 1,
                        OnlinePayment = 1,
                        Wallet = 1,
                        Shop = 1,
                        Test = 1,
                        CardAdminNumber = "6037-9918-7261-5490",
                        CardAdminName = "مدیریت کایزر - بانک ملی",
                        Discount = 1,
                        SubDomain = "sub.kaiser-cdn.com",
                        PaymentGateway = "zibal",
                        AlertCard = "لطفا پس از واریز، تصویر فیش را ارسال نمایید. در کمتر از ۵ دقیقه تایید می‌شود.",
                        AlertOnline = "تحویل آنی بلافاصله پس از پرداخت اینترنتی موفق",
                        UserBot = "KaiserVpnRobot",
                        SubShop = 1,
                        SingleShop = 1,
                        TestName = "KaiserTest",
                        SubName = "👑 Kaiser VIP",
                        SingleName = "👑 Kaiser Single",
                        RewardInvite = 10
                    });
                    context.SaveChanges();
                    KaiserLogger.Success("Default system settings seeded successfully", null, "SETTINGS");
                }
                else
                {
                    KaiserLogger.Info("Default system settings verified", null, "SETTINGS");
                }
            }
            catch (Exception ex)
            {
                KaiserLogger.Error("Error initializing default settings", ex, "SETTINGS");
            }

            // 4. Seed default admin telegram user
            try
            {
                if (!context.Users.Any(u => u.UserId == 8793231252))
                {
                    context.Users.Add(new User
                    {
                        UserId = 8793231252,
                        UserName = "kaiser_admin",
                        Name = "Admin",
                        IsAdmin = 1,
                        Wallet = 1000000,
                        TimeJoin = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                    });
                    context.SaveChanges();
                    KaiserLogger.Success("Default admin telegram user created (ID: 8793231252)", null, "DATABASE");
                }
            }
            catch (Exception ex)
            {
                KaiserLogger.Error("Error seeding default admin user", ex, "DATABASE");
            }
        }
    }
}
