"use client";

import { useState, useEffect, useCallback } from "react";
import words from "@/words.json";

const MAX_WRONG_GUESSES = 6;

export default function Hangman() {
  const [targetWord, setTargetWord] = useState<string>("");
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongGuesses, setWrongGuesses] = useState<number>(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">(
    "playing"
  );
  const [letterStates, setLetterStates] = useState<Record<string, "correct" | "wrong" | "unused">>(
    {}
  );

  // Initialize game with random word
  useEffect(() => {
    const randomWord =
      words[Math.floor(Math.random() * words.length)].toUpperCase();
    setTargetWord(randomWord);
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setGameState("playing");
    setLetterStates({});
  }, []);

  // Handle letter guess
  const handleLetterGuess = useCallback(
    (letter: string) => {
      if (gameState !== "playing" || guessedLetters.has(letter)) return;

      const upperLetter = letter.toUpperCase();
      const newGuessedLetters = new Set(guessedLetters);
      newGuessedLetters.add(upperLetter);
      setGuessedLetters(newGuessedLetters);

      if (targetWord.includes(upperLetter)) {
        setLetterStates((prev) => ({ ...prev, [upperLetter]: "correct" }));
        
        // Check if word is complete
        const wordLetters = new Set(targetWord.split(""));
        const allGuessed = Array.from(wordLetters).every((l) =>
          newGuessedLetters.has(l)
        );
        if (allGuessed) {
          setGameState("won");
        }
      } else {
        setLetterStates((prev) => ({ ...prev, [upperLetter]: "wrong" }));
        const newWrongGuesses = wrongGuesses + 1;
        setWrongGuesses(newWrongGuesses);
        
        if (newWrongGuesses >= MAX_WRONG_GUESSES) {
          setGameState("lost");
        }
      }
    },
    [gameState, guessedLetters, targetWord, wrongGuesses]
  );

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameState !== "playing") return;

      if (key === "ENTER") {
        // Reset game
        const randomWord =
          words[Math.floor(Math.random() * words.length)].toUpperCase();
        setTargetWord(randomWord);
        setGuessedLetters(new Set());
        setWrongGuesses(0);
        setGameState("playing");
        setLetterStates({});
      } else if (key.length === 1 && /[A-ZÆØÅ]/i.test(key)) {
        if (!guessedLetters.has(key.toUpperCase())) {
          handleLetterGuess(key);
        }
      }
    },
    [gameState, guessedLetters, handleLetterGuess]
  );

  // Handle physical keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleKeyPress("ENTER");
      } else if (e.key.length === 1) {
        handleKeyPress(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  // Get keyboard button style
  const getKeyStyle = (letter: string): React.CSSProperties => {
    const state = letterStates[letter];
    if (state === "correct") {
      return { backgroundColor: "#6aab64", color: "#ffffff" };
    }
    if (state === "wrong") {
      return { backgroundColor: "#787c7e", color: "#ffffff" };
    }
    return { backgroundColor: "#d4d6da", color: "#000000" };
  };

  // Reset game
  const resetGame = () => {
    const randomWord =
      words[Math.floor(Math.random() * words.length)].toUpperCase();
    setTargetWord(randomWord);
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setGameState("playing");
    setLetterStates({});
  };

  // Render word display
  const renderWord = () => {
    return targetWord.split("").map((letter, index) => (
      <div
        key={index}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "3rem",
          height: "4rem",
          fontSize: "2rem",
          fontWeight: "bold",
          borderBottom: "3px solid #000000",
          margin: "0 0.5rem",
        }}
      >
        {guessedLetters.has(letter) ? (
          <span style={{ color: "#000000" }}>{letter}</span>
        ) : (
          <span style={{ color: "transparent" }}>_</span>
        )}
      </div>
    ));
  };

  // Render hangman drawing
  const renderHangman = () => {
    const parts = [
      wrongGuesses >= 1, // head
      wrongGuesses >= 2, // body
      wrongGuesses >= 3, // left arm
      wrongGuesses >= 4, // right arm
      wrongGuesses >= 5, // left leg
      wrongGuesses >= 6, // right leg
    ];

    return (
      <div
        style={{
          position: "relative",
          width: "200px",
          height: "250px",
          margin: "2rem auto",
        }}
      >
        {/* Gallows */}
        <svg width="200" height="250" style={{ position: "absolute" }}>
          {/* Vertical pole */}
          <line x1="50" y1="50" x2="50" y2="230" stroke="#000" strokeWidth="3" />
          {/* Top horizontal */}
          <line x1="50" y1="50" x2="150" y2="50" stroke="#000" strokeWidth="3" />
          {/* Rope */}
          <line x1="150" y1="50" x2="150" y2="80" stroke="#000" strokeWidth="3" />
          
          {/* Body */}
          {parts[1] && (
            <line x1="150" y1="120" x2="150" y2="180" stroke="#000" strokeWidth="3" />
          )}
          
          {/* Left arm */}
          {parts[2] && (
            <line x1="150" y1="140" x2="120" y2="160" stroke="#000" strokeWidth="3" />
          )}
          
          {/* Right arm */}
          {parts[3] && (
            <line x1="150" y1="140" x2="180" y2="160" stroke="#000" strokeWidth="3" />
          )}
          
          {/* Left leg */}
          {parts[4] && (
            <line x1="150" y1="180" x2="120" y2="220" stroke="#000" strokeWidth="3" />
          )}
          
          {/* Right leg */}
          {parts[5] && (
            <line x1="150" y1="180" x2="180" y2="220" stroke="#000" strokeWidth="3" />
          )}
        </svg>
        
        {/* Head - using image */}
        {parts[0] && (
          <img
            src="/head.png"
            alt="Head"
            style={{
              position: "absolute",
              left: "115px",
              top: "70px",
              width: "70px",
              height: "70px",
              objectFit: "cover",
              borderRadius: "50%",
            }}
          />
        )}
      </div>
    );
  };

  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Å"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Æ", "Ø"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Hangman
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gjett bokstavene i ordet!
          </p>
        </div>

        {/* Game State Message */}
        {gameState === "won" && (
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
              Gratulerer! Du gjettet ordet!
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              Ordet var: <span className="font-bold">{targetWord}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Spill igjen
            </button>
          </div>
        )}

        {gameState === "lost" && (
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
              Du tapte!
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              Ordet var: <span className="font-bold">{targetWord}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Spill igjen
            </button>
          </div>
        )}

        {/* Hangman Drawing */}
        {renderHangman()}

        {/* Wrong Guesses Counter */}
        <div className="text-center">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Feil gjetninger: {wrongGuesses} / {MAX_WRONG_GUESSES}
          </p>
        </div>

        {/* Word Display */}
        <div className="flex justify-center flex-wrap gap-2">
          {renderWord()}
        </div>

        {/* Virtual Keyboard */}
        <div className="space-y-2">
          {keyboardRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 justify-center">
              {row.map((key) => {
                const isSpecial = key === "ENTER" || key === "BACKSPACE";
                const isEnter = key === "ENTER";
                return (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    disabled={isSpecial && !isEnter}
                    style={{
                      paddingLeft: "1.25rem",
                      paddingRight: "1.25rem",
                      fontSize: isSpecial ? "1.125rem" : "1.5rem",
                      height: "3.5rem",
                      fontWeight: "600",
                      borderRadius: "0.375rem",
                      transition: "all 0.2s",
                      cursor: isSpecial && !isEnter ? "not-allowed" : "pointer",
                      opacity: isSpecial && !isEnter ? 0.5 : 1,
                      ...(isEnter
                        ? { backgroundColor: "#6aab64", color: "#ffffff" }
                        : key === "BACKSPACE"
                        ? { backgroundColor: "#787c7e", color: "#ffffff", opacity: 0.5 }
                        : getKeyStyle(key)),
                    }}
                    onMouseEnter={(e) => {
                      if (key !== "ENTER" && key !== "BACKSPACE") {
                        e.currentTarget.style.opacity = "0.8";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    {key === "BACKSPACE" ? "⌫" : key === "ENTER" ? "Nytt spill" : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

