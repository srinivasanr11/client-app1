"use client";

import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "regenerator-runtime/runtime";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

import { Slider } from "../ui/components/Slider";
import Checkbox from "../ui/components/Checkbox";
import Transcription from "../app/components/Transcription";
import Visualization from "../app/components/Visualization";

const socket = io("ws://localhost:1234", {
  
  transports: ["websocket"],
});

export default function Home() {
  const wordAnimationsToPlay = useRef<[string, string][]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [signingSpeed, setSigningSpeed] = useState(25);
  const [isListening, setIsListening] = useState(false);
  const [ASLTranscription, setASLTranscription] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Always call hooks before any return
  useEffect(() => {
    setHasMounted(true);
    setIsSupported(
      typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }, []);

  useEffect(() => {
    const handleTranscription = (data: string) => {
      setASLTranscription(data);
    };

    const handleAnimation = (animations: [string, string][]) => {
      wordAnimationsToPlay.current = [
        ...wordAnimationsToPlay.current,
        ...animations,
      ];
    };

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("R-TRANSCRIPTION", handleTranscription);
    socket.on("E-ANIMATION", handleAnimation);

    return () => {
      socket.off("R-TRANSCRIPTION", handleTranscription);
      socket.off("E-ANIMATION", handleAnimation);
    };
  }, []);

  useEffect(() => {
    if (!transcript.trim()) return;

    const timeout = setTimeout(() => {
      socket.emit("E-REQUEST-ANIMATION", transcript.toLowerCase());
      resetTranscript();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [transcript, resetTranscript]);

  // ✅ Now it's safe to do conditional rendering
  if (!hasMounted) return null;

  if (!isSupported || !browserSupportsSpeechRecognition) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Your browser does not support speech recognition.
      </div>
    );
  }

  function getNextWord(): string | null {
    if (!wordAnimationsToPlay.current.length) return null;
    const [word, animation] = wordAnimationsToPlay.current.shift()!;
    setCurrentWord(word);
    return animation;
  }

  function toggleListening() {
    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
    } else {
      SpeechRecognition.startListening({ continuous: true });
      setIsListening(true);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function clearTranscription() {
    socket.emit("R-CLEAR-TRANSCRIPTION");
    setASLTranscription("");
  }

  return (
    <div className="w-screen h-screen flex flex-row gap-4 p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black justify-center">
      <div className="flex flex-col gap-4 items-center grow">
        <h1 className="text-3xl text-[#F4E7E1] font-semibold font-serif">
          SIGN SPELL - VOICING THE UNSPOKEN
        </h1>

        <div className="border w-full h-full flex-col flex rounded">
          <Visualization
            signingSpeed={signingSpeed}
            getNextWord={getNextWord}
            currentWord={currentWord}
          />

          <Transcription content={transcript} />

          {ASLTranscription && (
            <div className="px-4 text-white text-sm italic">
              ASL Gloss: {ASLTranscription}
            </div>
          )}

          <div className="py-4 px-4 flex flex-col items-start gap-2 bg-white bg-opacity-10">
            <div className="flex items-center justify-between w-full">
              <p className="text-lg text-white ">Signing Speed</p>

              <div className="flex items-center gap-4">
                <button
                  onClick={toggleListening}
                  className="px-4 py-1 border-white border-opacity-20 border rounded hover:bg-white hover:bg-opacity-10 transition duration-300 cursor-pointer"
                >
                  <p className="text-white select-none">
                    {isListening ? "Stop" : "Start"}
                  </p>
                </button>
                <Checkbox label="ASL Gloss" />
              </div>
            </div>

            <Slider
              defaultValue={[signingSpeed]}
              value={[signingSpeed]}
              onValueChange={(value) => setSigningSpeed(value[0])}
              min={20}
              max={100}
              step={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
