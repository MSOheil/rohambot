FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Kaiser.Backend.csproj", "./"]
RUN dotnet restore "Kaiser.Backend.csproj"
COPY . .
RUN dotnet publish "Kaiser.Backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p /app/db
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV KaiserConfig__BotToken=8992025570:AAHsMAOG5_UbZXMW_CrkmufBq-4IW4I31zI
ENTRYPOINT ["dotnet", "Kaiser.Backend.dll"]
