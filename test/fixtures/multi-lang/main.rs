use std::env;

fn main() {
    // Database configuration
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let db_pool_size = env::var("DB_POOL_SIZE")
        .unwrap_or_else(|_| "10".to_string())
        .parse::<u32>()
        .unwrap_or(10);
    
    // API configuration
    let api_key = env::var("API_KEY").ok();
    let api_secret = std::env::var("API_SECRET").unwrap_or_default();
    let api_endpoint = env::var("API_ENDPOINT")
        .unwrap_or_else(|_| "https://default.api.com".to_string());
    
    // Redis configuration
    let redis_host = env::var("REDIS_HOST").expect("REDIS_HOST required");
    let redis_port = env::var("REDIS_PORT")
        .unwrap_or_else(|_| "6379".to_string())
        .parse::<u16>()
        .unwrap_or(6379);
    let redis_password = env::var("REDIS_PASSWORD").ok();
    
    // Application settings
    let node_env = env::var("NODE_ENV").unwrap_or_else(|_| "development".to_string());
    let port = env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()
        .unwrap_or(3000);
    let log_level = std::env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string());
    
    // Feature flags
    let enable_caching = env::var("ENABLE_CACHING")
        .unwrap_or_else(|_| "false".to_string()) == "true";
    let enable_analytics = env::var("ENABLE_ANALYTICS").ok()
        .map(|v| v == "true")
        .unwrap_or(false);
    
    // AWS configuration
    let aws_region = env::var("AWS_REGION").expect("AWS_REGION required");
    let aws_access_key_id = env::var("AWS_ACCESS_KEY_ID").ok();
    let aws_secret_access_key = std::env::var("AWS_SECRET_ACCESS_KEY").ok();
    
    // Missing variables (not in .env.example)
    let sentry_dsn = env::var("SENTRY_DSN").ok();
    let datadog_api_key = std::env::var("DATADOG_API_KEY").ok();
    
    println!("Database URL: {}", database_url);
    println!("Pool size: {}", db_pool_size);
    println!("API Key: {:?}", api_key);
    println!("Port: {}", port);
    println!("Environment: {}", node_env);
    println!("Log level: {}", log_level);
    println!("Redis: {}:{}", redis_host, redis_port);
    println!("Caching: {}, Analytics: {}", enable_caching, enable_analytics);
    println!("AWS Region: {}", aws_region);
}
