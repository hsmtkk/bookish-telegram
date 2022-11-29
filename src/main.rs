use anyhow::{Result};
use axum::{
    routing::get,
    Router,
};

#[tokio::main]
async fn main() {
    let port = get_port().unwrap();
    let addr: std::net::SocketAddr = format!("0.0.0.0:{}", port).parse().unwrap();

    let app = Router::new().route("/", get(|| async { "Hello, World!" }));

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

fn get_port() -> Result<u32> {
    let port_str = std::env::var("PORT")?;
    let port: u32 = port_str.parse::<u32>()?;
    Ok(port)
}
