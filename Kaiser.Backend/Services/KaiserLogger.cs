using System.Globalization;
using System.Text.Json;

namespace Kaiser.Backend.Services
{
    public static class KaiserLogger
    {
        private static readonly object _lock = new();
        private static readonly PersianCalendar _pc = new();

        // ANSI Color Codes for terminal
        private const string RESET = "\x1b[0m";
        private const string BOLD = "\x1b[1m";
        private const string RED = "\x1b[31m";
        private const string GREEN = "\x1b[32m";
        private const string YELLOW = "\x1b[33m";
        private const string BLUE = "\x1b[34m";
        private const string MAGENTA = "\x1b[35m";
        private const string CYAN = "\x1b[36m";

        public static string GetShamsiDate(DateTime date)
        {
            return $"{_pc.GetYear(date):0000}-{_pc.GetMonth(date):00}-{_pc.GetDayOfMonth(date):00}";
        }

        public static string GetShamsiDateTime(DateTime date)
        {
            return $"{_pc.GetYear(date):0000}-{_pc.GetMonth(date):00}-{_pc.GetDayOfMonth(date):00} {date:HH:mm:ss}";
        }

        public static void Log(string level, string message, object? data = null, string category = "SYSTEM", Exception? ex = null)
        {
            try
            {
                var tehranTime = DateTime.UtcNow.AddHours(3.5);
                var shamsiDay = GetShamsiDate(tehranTime);
                var shamsiTimeStr = GetShamsiDateTime(tehranTime);

                // 1. Console Output with ANSI Colors
                string colorPrefix;
                string icon;

                switch (level.ToUpper())
                {
                    case "SUCCESS":
                        colorPrefix = $"{BOLD}{GREEN}";
                        icon = "✅";
                        break;
                    case "ERROR":
                        colorPrefix = $"{BOLD}{RED}";
                        icon = "❌";
                        break;
                    case "WARN":
                        colorPrefix = $"{BOLD}{YELLOW}";
                        icon = "⚠️";
                        break;
                    case "DATABASE":
                        colorPrefix = $"{BOLD}{MAGENTA}";
                        icon = "🗄️";
                        break;
                    case "NETWORK":
                        colorPrefix = $"{BOLD}{BLUE}";
                        icon = "🌐";
                        break;
                    default:
                        colorPrefix = $"{CYAN}";
                        icon = "ℹ️";
                        break;
                }

                var dataStr = data != null ? " " + JsonSerializer.Serialize(data) : "";
                var exStr = ex != null ? $"\n{RED}{ex.GetType().Name}: {ex.Message}\n{ex.StackTrace}{RESET}" : "";

                Console.WriteLine($"[{shamsiTimeStr}] [{BOLD}kaiser-backend{RESET}] [{colorPrefix}{category.ToUpper()}{RESET}] {icon} {colorPrefix}{message}{RESET}{dataStr}{exStr}");

                // 2. Append Pure JSON Line to Daily Shamsi Log File
                var logsDir = Path.Combine(Directory.GetCurrentDirectory(), "logs");
                if (!Directory.Exists(logsDir))
                {
                    Directory.CreateDirectory(logsDir);
                }

                var filePath = Path.Combine(logsDir, $"{shamsiDay}.json");

                var logEntry = new
                {
                    timestamp = DateTime.UtcNow.ToString("o"),
                    shamsi_date = shamsiDay,
                    shamsi_time = shamsiTimeStr,
                    level = level.ToUpper(),
                    service = "kaiser-backend",
                    category = category.ToUpper(),
                    message,
                    data,
                    error = ex != null ? new
                    {
                        message = ex.Message,
                        type = ex.GetType().Name,
                        stack = ex.StackTrace
                    } : null
                };

                var jsonLine = JsonSerializer.Serialize(logEntry) + "\n";
                lock (_lock)
                {
                    File.AppendAllText(filePath, jsonLine);
                }
            }
            catch { }
        }

        public static void Info(string message, object? data = null, string category = "SYSTEM") => Log("INFO", message, data, category);
        public static void Success(string message, object? data = null, string category = "SYSTEM") => Log("SUCCESS", message, data, category);
        public static void Warn(string message, object? data = null, string category = "SYSTEM") => Log("WARN", message, data, category);
        public static void Error(string message, Exception? ex = null, string category = "SYSTEM", object? data = null) => Log("ERROR", message, data, category, ex);
        public static void Database(string message, object? data = null, bool isSuccess = true) => Log(isSuccess ? "DATABASE" : "ERROR", message, data, "DATABASE");
        public static void Network(string message, object? data = null, bool isSuccess = true) => Log(isSuccess ? "NETWORK" : "ERROR", message, data, "NETWORK");
    }
}
