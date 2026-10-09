# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY LogisticsFleetTracker.Api/LogisticsFleetTracker.Api.csproj LogisticsFleetTracker.Api/
RUN dotnet restore LogisticsFleetTracker.Api/LogisticsFleetTracker.Api.csproj

# Copy project source and publish
COPY LogisticsFleetTracker.Api/ LogisticsFleetTracker.Api/
WORKDIR /src/LogisticsFleetTracker.Api
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "LogisticsFleetTracker.Api.dll"]
