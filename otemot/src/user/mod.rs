use crate::db::{self, DefaultMessage};
use crate::error::{new_ejson, OError};
use crate::user::model::{CreateUser, LoginUser, PollResponse, SlimUser, User};
use rocket::http::{Cookie, Cookies};
use rocket_contrib::json::Json;

pub mod model;
pub mod token;

#[post("/", data = "<user>")]
fn register(
	user: Json<CreateUser>,
	connection: db::Connection,
) -> Result<Json<DefaultMessage>, OError> {
	let user = user.into_inner();

	if user.username.is_empty()
		|| user.password.is_empty()
		|| user.confirmPassword.is_empty()
		|| user.email.is_empty()
	{
		return Err(OError::BadRequest(new_ejson(
			"Please fill out all of the fields!",
		)));
	}

	User::create(user, &connection)?;
	Ok(Json(DefaultMessage {
		message: "Successfully registered! You can log in now.".into(),
	}))
}

#[post("/", data = "<user>")]
fn login(
	user: Json<LoginUser>,
	connection: db::Connection,
	mut cookies: Cookies,
) -> Result<Json<SlimUser>, OError> {
	let user = user.into_inner();
	let id = User::check_password(&user, &connection)?;
	let token = token::create_token(&SlimUser {
		id,
		username: user.username.clone(),
	})?;
	cookies.add_private(Cookie::new("auth", token));
	Ok(Json(SlimUser {
		id,
		username: user.username.clone(),
	}))
}

#[delete("/")]
fn logout(mut cookies: Cookies) {
	cookies.remove_private(Cookie::named("auth"));
}

#[get("/")]
fn poll(user: SlimUser, connection: db::Connection) -> Result<Json<PollResponse>, OError> {
	let has_avatar = User::check_avatar(&user, &connection)?;
	Ok(Json(PollResponse {
		has_avatar,
	}))
}

pub fn mount(rocket: rocket::Rocket) -> rocket::Rocket {
	rocket
		.mount("/api/register", routes![register])
		.mount("/api/auth", routes![login, logout])
		.mount("/api/poll", routes![poll])
}