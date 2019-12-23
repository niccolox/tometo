defmodule AphWeb.InvitationView do
  use AphWeb, :view
  alias AphWeb.InvitationView

  def render("index.json", %{invitations: invitations}) do
    %{data: render_many(invitations, InvitationView, "invitation.json")}
  end

  def render("for_user.json", %{invitations: invitations}) do
    %{data: render_many(invitations, InvitationView, "invitation.json"), limit: 10}
  end

  def render("show.json", %{invitation: invitation}) do
    %{data: render_one(invitation, InvitationView, "invitation.json")}
  end

  def render("invitation.json", %{invitation: invitation}) do
    %{code: invitation.code,
      used_by: invitation.used_by}
  end
end
