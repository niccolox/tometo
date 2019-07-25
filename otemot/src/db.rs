use diesel::pg::PgConnection;
use diesel::r2d2::{ConnectionManager, Pool, PooledConnection};
use rocket::request::{self, FromRequest};
use rocket::{Request, State, Outcome};
use rocket::http::Status;
use std::ops::Deref;

pub type PgPool = Pool<ConnectionManager<PgConnection>>;

pub fn connect(db_url: String) -> PgPool {
	let manager = ConnectionManager::<PgConnection>::new(db_url);
	Pool::new(manager).expect("Failed to create DB pool!")
}

pub struct Connection(pub PooledConnection<ConnectionManager<PgConnection>>);

impl<'a, 'r> FromRequest<'a, 'r> for Connection {
	type Error = ();

	fn from_request(request: &'a Request<'r>) -> request::Outcome<Self, Self::Error> {
		let pool = request.guard::<State<PgPool>>()?;
		match pool.get() {
			Ok(conn) => Outcome::Success(Connection(conn)),
			Err(_) => Outcome::Failure((Status::ServiceUnavailable, ())),
		}
	}
}

impl Deref for Connection {
	type Target = PgConnection;

	fn deref(&self) -> &Self::Target {
		&self.0
	}
}
