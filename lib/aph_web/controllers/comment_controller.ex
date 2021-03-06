defmodule AphWeb.CommentController do
  @moduledoc """
  The Comment controller.

  Comments can be attached to an answer, but can be related to a different user.
  """
  use AphWeb, :controller

  import Ecto.Query

  alias Aph.Main.Avatar
  alias Aph.QA
  alias Aph.QA.Comment
  alias Aph.Repo

  action_fallback AphWeb.FallbackController

  def show_for_answer(conn, %{"id" => id}) do
    comments = QA.get_comments_for_answer(id)
    conn |> render(:comments, comments: comments)
  end

  def create(%Plug.Conn{assigns: %{current_user: user}} = conn, %{
        "content" => content,
        "answer_id" => answer_id
      }) do
    av = Repo.one(from(a in Avatar, where: a.user_id == ^user.id))

    if !av do
      conn
      |> put_status(:bad_request)
      |> put_view(AphWeb.ErrorView)
      |> render(:insufficient_input, message: "Create an avatar first!")
    end

    answer = QA.get_answer(answer_id)

    if !answer do
      conn
      |> put_status(:bad_request)
      |> put_view(AphWeb.ErrorView)
      |> render(:invalid_input, message: "You attempted to comment on a nonexistent answer!")
    end

    comment = %{
      content: content,
      answer_id: answer.id,
      avatar_id: av.id
    }

    case QA.create_comment(av, comment) do
      {:ok, %Comment{} = comment} ->
        conn
        |> put_status(:created)
        |> render(:comment_simple, comment: comment)

      {:error, err} ->
        conn
        |> put_status(:internal_server_error)
        |> put_view(AphWeb.ErrorView)
        |> render(:internal_error, message: err)
    end
  end

  def update(%Plug.Conn{assigns: %{current_user: user}} = conn, %{
        "id" => id,
        "content" => content
      }) do
    av = Repo.one(from(a in Avatar, where: a.user_id == ^user.id))
    comment = QA.get_comment(id)

    if !comment or !av or comment.avatar_id != av.id do
      conn
      |> put_status(:unauthorized)
      |> put_view(AphWeb.ErrorView)
      |> render(:no_auth)
    end

    case QA.update_comment(comment, %{content: content}) do
      {:ok, %Comment{} = comment} ->
        conn
        |> render(:comment_simple, comment: comment)

      {:error, err} ->
        conn
        |> put_status(:internal_server_error)
        |> put_view(AphWeb.ErrorView)
        |> render(:internal_error, message: err)
    end
  end

  def delete(%Plug.Conn{assigns: %{current_user: user}} = conn, %{"id" => id}) do
    av = Repo.one(from(a in Avatar, where: a.user_id == ^user.id))
    comment = QA.get_comment(id)

    if !av or !comment or comment.avatar_id != av.id do
      conn
      |> put_status(:unauthorized)
      |> put_view(AphWeb.ErrorView)
      |> render(:no_auth)
    end

    with {:ok, %Comment{}} <- QA.delete_comment(comment) do
      send_resp(conn, :no_content, "")
    end
  end
end
