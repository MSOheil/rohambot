using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Kaiser.Backend.Models;

namespace Kaiser.Backend.Services
{
    public interface IXuiService
    {
        Task<bool> LoginAsync(Server server);
        Task<TestServerPingResponse> TestConnectionAsync(Server server);
        Task<bool> AddClientAsync(Server server, string email, string uuid, long totalBytes, long expireTimestamp, int limitIp);
        Task<bool> DeleteClientAsync(Server server, string email, string uuid);
        Task<bool> ResetTrafficAsync(Server server, string email);
        Task<(long upload, long download, long total)> GetClientTrafficAsync(Server server, string email);
    }

    public class XuiService : IXuiService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<XuiService> _logger;

        public XuiService(IHttpClientFactory httpClientFactory, ILogger<XuiService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        private HttpClient CreateClient(Server server, CookieContainer cookieContainer)
        {
            var handler = new HttpClientHandler
            {
                CookieContainer = cookieContainer,
                ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true,
                AllowAutoRedirect = true
            };
            var client = new HttpClient(handler)
            {
                BaseAddress = new Uri(server.Url?.TrimEnd('/') + "/"),
                Timeout = TimeSpan.FromSeconds(10)
            };
            client.DefaultRequestHeaders.Add("User-Agent", "Kaiser-Manager/2.0");
            return client;
        }

        public async Task<bool> LoginAsync(Server server)
        {
            try
            {
                var cookies = new CookieContainer();
                using var client = CreateClient(server, cookies);

                var content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("username", server.User ?? "admin"),
                    new KeyValuePair<string, string>("password", server.Password ?? "admin")
                });

                var response = await client.PostAsync("login", content);
                if (response.IsSuccessStatusCode)
                {
                    var responseStr = await response.Content.ReadAsStringAsync();
                    if (responseStr.Contains("\"success\":true") || responseStr.Contains("\"success\": true"))
                    {
                        return true;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging in to X-UI server {ServerName}", server.Name);
            }
            return false;
        }

        public async Task<TestServerPingResponse> TestConnectionAsync(Server server)
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            try
            {
                var cookies = new CookieContainer();
                using var client = CreateClient(server, cookies);

                var content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("username", server.User ?? "admin"),
                    new KeyValuePair<string, string>("password", server.Password ?? "admin")
                });

                var loginResp = await client.PostAsync("login", content);
                sw.Stop();

                if (!loginResp.IsSuccessStatusCode)
                {
                    return new TestServerPingResponse
                    {
                        Success = false,
                        PingMs = sw.ElapsedMilliseconds,
                        Message = $"خطا در اتصال به سرور (کد وضعیت: {loginResp.StatusCode})"
                    };
                }

                // Try fetching inbounds list
                var listResp = await client.GetAsync("panel/api/inbounds/list");
                int inboundsCount = 0;
                if (listResp.IsSuccessStatusCode)
                {
                    var listJson = await listResp.Content.ReadAsStringAsync();
                    var node = JsonNode.Parse(listJson);
                    if (node?["obj"] is JsonArray arr)
                    {
                        inboundsCount = arr.Count;
                    }
                }

                return new TestServerPingResponse
                {
                    Success = true,
                    PingMs = sw.ElapsedMilliseconds,
                    Message = "اتصال با موفقیت برقرار شد.",
                    InboundsCount = inboundsCount
                };
            }
            catch (Exception ex)
            {
                sw.Stop();
                return new TestServerPingResponse
                {
                    Success = false,
                    PingMs = sw.ElapsedMilliseconds,
                    Message = $"خطا: {ex.Message}"
                };
            }
        }

        public async Task<bool> AddClientAsync(Server server, string email, string uuid, long totalBytes, long expireTimestamp, int limitIp)
        {
            try
            {
                var cookies = new CookieContainer();
                using var client = CreateClient(server, cookies);

                // Login
                var loginContent = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("username", server.User ?? "admin"),
                    new KeyValuePair<string, string>("password", server.Password ?? "admin")
                });
                await client.PostAsync("login", loginContent);

                // Build client object
                var clientObj = new
                {
                    id = uuid,
                    email = email,
                    totalGB = totalBytes,
                    expiryTime = expireTimestamp > 0 ? expireTimestamp * 1000 : 0,
                    enable = true,
                    flow = "",
                    limitIp = limitIp,
                    fingerprint = "chrome"
                };

                var payload = new
                {
                    id = server.InboundId,
                    settings = JsonSerializer.Serialize(new { clients = new[] { clientObj } })
                };

                var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await client.PostAsync("panel/api/inbounds/addClient", jsonContent);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding client to server {ServerName}", server.Name);
                return false;
            }
        }

        public async Task<bool> DeleteClientAsync(Server server, string email, string uuid)
        {
            try
            {
                var cookies = new CookieContainer();
                using var client = CreateClient(server, cookies);

                var loginContent = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("username", server.User ?? "admin"),
                    new KeyValuePair<string, string>("password", server.Password ?? "admin")
                });
                await client.PostAsync("login", loginContent);

                var response = await client.PostAsync($"panel/api/inbounds/{server.InboundId}/delClient/{uuid}", null);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting client from server {ServerName}", server.Name);
                return false;
            }
        }

        public async Task<bool> ResetTrafficAsync(Server server, string email)
        {
            try
            {
                var cookies = new CookieContainer();
                using var client = CreateClient(server, cookies);

                var loginContent = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("username", server.User ?? "admin"),
                    new KeyValuePair<string, string>("password", server.Password ?? "admin")
                });
                await client.PostAsync("login", loginContent);

                var response = await client.PostAsync($"panel/api/inbounds/{server.InboundId}/resetClientTraffic/{email}", null);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting client traffic on server {ServerName}", server.Name);
                return false;
            }
        }

        public async Task<(long upload, long download, long total)> GetClientTrafficAsync(Server server, string email)
        {
            try
            {
                var cookies = new CookieContainer();
                using var client = CreateClient(server, cookies);

                var loginContent = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("username", server.User ?? "admin"),
                    new KeyValuePair<string, string>("password", server.Password ?? "admin")
                });
                await client.PostAsync("login", loginContent);

                var response = await client.GetAsync($"panel/api/inbounds/getClientTraffics/{email}");
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var node = JsonNode.Parse(json);
                    if (node?["obj"] is JsonObject obj)
                    {
                        long up = obj["up"]?.GetValue<long>() ?? 0;
                        long down = obj["down"]?.GetValue<long>() ?? 0;
                        long total = obj["total"]?.GetValue<long>() ?? 0;
                        return (up, down, total);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching client traffic for {Email} on server {ServerName}", email, server.Name);
            }
            return (0, 0, 0);
        }
    }
}
