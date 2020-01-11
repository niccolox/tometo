defmodule Aph.TTS do
  @g_lang_map %{
    ar: "ar-XA",
    nl: "nl-NL",
    en: "en-US",
    fr: "fr-FR",
    de: "de-DE",
    hi: "hi-IN",
    id: "id-ID",
    it: "it-IT",
    ja: "ja-JP",
    ko: "ko-KR",
    zh: "cmn-CN",
    nb: "nb-NO",
    pl: "pl-PL",
    pt: "pt-PT",
    ru: "ru-RU",
    tr: "tr-TR",
    vi: "vi-VN"
  }

  @a_lang_map %{
    ar: :ara,
    nl: :nld,
    en: :eng,
    fr: :fra,
    de: :deu,
    hi: :hin,
    id: :ind,
    it: :ita,
    ja: :jpn,
    ko: :kor,
    zh: :cmn,
    nb: :nor,
    pl: :pol,
    pt: :por,
    ru: :rus,
    tr: :tur,
    vi: :vie
  }

  def synthesize(status, av) do
    File.mkdir_p!("gentts/#{status.id}")

    if Application.get_env(:aph, :tts) == "google" do
      api_key = Application.get_env(:aph, :google_key)
      gender_num = if av.gender == "FEMALE", do: "A", else: "B"
      lang = @g_lang_map[String.to_atom(av.language)]

      body =
        Jason.encode!(%{
          input: %{text: status.content},
          voice: %{languageCode: lang, name: "#{lang}-Standard-#{gender_num}"},
          audioConfig: %{audioEncoding: "OGG_OPUS", pitch: av.pitch || 0, speakingRate: av.speed || 1.0}
        })
      IO.inspect body

      headers = [{"content-type", "application/json"}]

      with {:ok, res} <-
             HTTPoison.post(
               "https://texttospeech.googleapis.com/v1/text:synthesize?key=#{api_key}",
               body,
               headers
             ),
           {:ok, json} <- Jason.decode(res.body),
           {:ok, content} <- Base.decode64(json["audioContent"]),
           :ok <- File.write("gentts/#{status.id}/temp.ogg", content),
           :ok <- align(status.id, status.content, av.language) do
        :ok
      else
        {:error, err} -> {:tts_error, err}
      end
    else
      scale_pitch = (av.pitch + 20) / 40 * 99
      scale_speed = floor((av.speed - 0.25) / 3.75 * 370.0 + 80.0)

      with {_, 0} <-
             System.cmd("espeak", [
               "-p",
               to_string(scale_pitch),
               "-s",
               to_string(scale_speed),
               "-w",
               "gentts/#{status.id}/temp.wav",
               status.content
             ]),
           {_, 0} <-
             System.cmd("ffmpeg", [
               "-i",
               "gentts/#{status.id}/temp.wav",
               "-c:a",
               "libopus",
               "-b:a",
               "96K",
               "gentts/#{status.id}/temp.ogg"
             ]),
           :ok <- align(status.id, status.content, av.language) do
        :ok
      else
        {_error, 1} -> {:tts_error, status.id}
      end
    end
  end

  def clean(name) do
    with :ok <- File.cp("gentts/#{name}/out.json", "priv/static/st#{name}.json"),
         :ok <- File.cp("gentts/#{name}/temp.ogg", "priv/static/st#{name}.ogg"),
         {:ok, _} <- File.rm_rf("gentts/#{name}") do
      :ok
    else
      e -> {:tts_error, e}
    end
  end

  defp align(name, text, lang) do
    lang = @a_lang_map[String.to_atom(lang)]
    with :ok <-
           File.write("gentts/#{name}/temp.txt", text |> String.split(" ") |> Enum.join("\n")),
         {_, 0} <-
           System.cmd("python3", [
             "-m",
             "aeneas.tools.execute_task",
             "gentts/#{name}/temp.ogg",
             "gentts/#{name}/temp.txt",
             "task_language=#{Atom.to_string(lang)}|os_task_file_format=json|is_text_type=plain",
             "gentts/#{name}/out.json"
           ]) do
      :ok
    else
      {:error, err} -> {:error, err}
      {err, 1} -> {:error, err}
    end
  end
end