using Microsoft.EntityFrameworkCore;
using Kaiser.Backend.Data;
using Kaiser.Backend.Models;

namespace Kaiser.Backend.Services
{
    public class BackgroundWorkerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BackgroundWorkerService> _logger;

        public BackgroundWorkerService(IServiceProvider serviceProvider, ILogger<BackgroundWorkerService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            KaiserLogger.Success("Kaiser Background Worker Service started", null, "BACKGROUND_WORKER");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var xuiService = scope.ServiceProvider.GetRequiredService<IXuiService>();

                    await CheckServerConnectionsAsync(db, xuiService);
                    await CheckExpiredServicesAsync(db);
                    await CleanupOldPendingOrdersAsync(db);
                }
                catch (Exception ex)
                {
                    KaiserLogger.Error("Error in Kaiser Background Worker cycle", ex, "BACKGROUND_WORKER");
                }

                // Wait 2 minutes between cycles
                await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
            }
        }

        private async Task CheckServerConnectionsAsync(AppDbContext db, IXuiService xuiService)
        {
            var servers = await db.Servers.Where(s => s.State == 1).ToListAsync();
            foreach (var server in servers)
            {
                var result = await xuiService.TestConnectionAsync(server);
                int newConn = result.Success ? 1 : 0;
                if (server.Connection != newConn)
                {
                    server.Connection = newConn;
                    if (newConn == 0)
                    {
                        server.DateConnectionLost = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                        KaiserLogger.Warn($"⚠️ Server connection lost: [{server.Id}] {server.Name} ({server.Url})", new { serverId = server.Id, serverName = server.Name, error = result.Message }, "SERVER_HEALTH");
                    }
                    else
                    {
                        KaiserLogger.Success($"✅ Server connection restored: [{server.Id}] {server.Name} (Ping: {result.PingMs}ms)", new { serverId = server.Id, serverName = server.Name, ping = result.PingMs }, "SERVER_HEALTH");
                    }
                }
            }
            await db.SaveChangesAsync();
        }

        private async Task CheckExpiredServicesAsync(AppDbContext db)
        {
            long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var activeServices = await db.Services.Where(s => s.State == 1 && s.isDelete == 0).ToListAsync();

            int deactivatedCount = 0;
            foreach (var s in activeServices)
            {
                // Check if time expired
                if (s.EndDate > 0 && s.EndDate < now)
                {
                    s.State = 0;
                    deactivatedCount++;
                    KaiserLogger.Warn($"Service #{s.Id} ({s.Email}) expired by date and deactivated", new { serviceId = s.Id, email = s.Email }, "SUBSCRIPTION");
                }
                // Check if traffic exceeded
                else if (s.TotalUsed > 0 && (s.Upload + s.Download) >= s.TotalUsed)
                {
                    s.State = 0;
                    deactivatedCount++;
                    KaiserLogger.Warn($"Service #{s.Id} ({s.Email}) exceeded traffic limit and deactivated", new { serviceId = s.Id, email = s.Email, totalUsed = s.TotalUsed }, "SUBSCRIPTION");
                }
            }

            if (deactivatedCount > 0)
            {
                await db.SaveChangesAsync();
                KaiserLogger.Info($"Deactivated {deactivatedCount} expired services", new { count = deactivatedCount }, "SUBSCRIPTION");
            }
        }

        private async Task CleanupOldPendingOrdersAsync(AppDbContext db)
        {
            long oneDayAgo = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - 86400;
            var oldPending = await db.Orders.Where(o => o.State == 0 && o.DateTime < oneDayAgo).ToListAsync();
            if (oldPending.Any())
            {
                foreach (var o in oldPending)
                {
                    o.State = 2; // mark rejected / cancelled
                }
                await db.SaveChangesAsync();
                KaiserLogger.Info($"Cleaned up {oldPending.Count} expired pending orders", new { count = oldPending.Count }, "ORDERS");
            }
        }
    }
}
