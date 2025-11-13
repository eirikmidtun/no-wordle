"use client";

import { useState, useEffect, useCallback } from "react";
import words from "@/words.json";

type LetterState = "correct" | "present" | "absent" | "empty";

interface Cell {
  letter: string;
  state: LetterState;
}

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

export default function Wordle() {
  const [targetWord, setTargetWord] = useState<string>("");
  const [guesses, setGuesses] = useState<Cell[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">(
    "playing"
  );
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>(
    {}
  );
  const [invalidWordMessages, setInvalidWordMessages] = useState<
    Array<{ id: number; fadeOut: boolean }>
  >([]);

  // Initialize game with random word
  useEffect(() => {
    const randomWord =
      words[Math.floor(Math.random() * words.length)].toUpperCase();
    setTargetWord(randomWord);
    setGuesses([]);
    setCurrentGuess("");
    setGameState("playing");
    setLetterStates({});
  }, []);

  // Evaluate guess and return cell states
  const evaluateGuess = useCallback((guess: string, target: string): Cell[] => {
    const cells: Cell[] = [];
    const targetLetters = target.split("");
    const guessLetters = guess.split("");
    const usedIndices = new Set<number>();

    // First pass: mark correct positions (green)
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        cells[i] = { letter: guessLetters[i], state: "correct" };
        usedIndices.add(i);
      } else {
        cells[i] = { letter: guessLetters[i], state: "empty" };
      }
    }

    // Second pass: mark present letters (yellow)
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (cells[i].state === "correct") continue;

      const letter = guessLetters[i];
      const targetIndex = targetLetters.findIndex(
        (targetLetter, idx) => targetLetter === letter && !usedIndices.has(idx)
      );

      if (targetIndex !== -1) {
        cells[i].state = "present";
        usedIndices.add(targetIndex);
      } else {
        cells[i].state = "absent";
      }
    }

    return cells;
  }, []);

  // Update letter states for keyboard
  const updateLetterStates = useCallback(
    (cells: Cell[]) => {
      const newStates = { ...letterStates };
      cells.forEach((cell) => {
        const letter = cell.letter;
        const currentState = newStates[letter];

        // Only update if the new state is "better"
        if (!currentState || currentState === "absent") {
          newStates[letter] = cell.state;
        } else if (currentState === "present" && cell.state === "correct") {
          newStates[letter] = "correct";
        }
      });
      setLetterStates(newStates);
    },
    [letterStates]
  );

  // Handle guess submission
  const submitGuess = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH || gameState !== "playing") return;
    const upperGuess = currentGuess.toUpperCase();
    const upperWords = words.map((w: string) => w.toUpperCase());
    if (!upperWords.includes(upperGuess)) {
      const messageId = Date.now();
      setInvalidWordMessages((prev) => {
        const newMessages = [...prev, { id: messageId, fadeOut: false }];
        // Keep only the last 6 messages
        return newMessages.slice(-6);
      });

      setTimeout(() => {
        setInvalidWordMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, fadeOut: true } : msg
          )
        );
        setTimeout(() => {
          setInvalidWordMessages((prev) =>
            prev.filter((msg) => msg.id !== messageId)
          );
        }, 300);
      }, 1200);
      return;
    }

    const evaluatedCells = evaluateGuess(
      currentGuess.toUpperCase(),
      targetWord
    );
    const newGuesses = [...guesses, evaluatedCells];
    setGuesses(newGuesses);
    updateLetterStates(evaluatedCells);

    if (currentGuess.toUpperCase() === targetWord) {
      setGameState("won");
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameState("lost");
    }

    setCurrentGuess("");
  }, [
    currentGuess,
    targetWord,
    guesses,
    gameState,
    evaluateGuess,
    updateLetterStates,
  ]);

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameState !== "playing") return;

      if (key === "ENTER") {
        submitGuess();
      } else if (key === "BACKSPACE" || key === "DELETE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (key.length === 1 && /[A-ZÆØÅ]/i.test(key)) {
        if (currentGuess.length < WORD_LENGTH) {
          setCurrentGuess((prev) => prev + key.toUpperCase());
        }
      }
    },
    [currentGuess, gameState, submitGuess]
  );

  // Handle physical keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleKeyPress("ENTER");
      } else if (e.key === "Backspace") {
        handleKeyPress("BACKSPACE");
      } else if (e.key.length === 1) {
        handleKeyPress(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  // Render cell
  const renderCell = (
    cell: Cell | undefined,
    rowIndex: number,
    colIndex: number
  ) => {
    const isCurrentRow = rowIndex === guesses.length;
    const letter =
      isCurrentRow && colIndex < currentGuess.length
        ? currentGuess[colIndex]
        : cell?.letter || "";
    const state = isCurrentRow ? "empty" : cell?.state || "empty";

    const getCellStyle = () => {
      const baseStyle = {
        display: "flex",
        height: "5rem",
        width: "5rem",
        minWidth: "5rem",
        maxWidth: "5rem",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: "2px",
        borderStyle: "solid",
        fontSize: "2rem",
        fontWeight: "bold",
        textTransform: "uppercase" as const,
        transition: "all 0.3s",
        transform: letter ? "scale(1.05)" : "scale(1)",
        boxSizing: "border-box" as const,
        flexShrink: 0,
        overflow: "hidden",
      };

      switch (state) {
        case "correct":
          return {
            ...baseStyle,
            backgroundColor: "#6aab64",
            borderColor: "#6aab64",
            color: "#ffffff",
          };
        case "present":
          return {
            ...baseStyle,
            backgroundColor: "#cab458",
            borderColor: "#cab458",
            color: "#ffffff",
          };
        case "absent":
          return {
            ...baseStyle,
            backgroundColor: "#787c7e",
            borderColor: "#787c7e",
            color: "#ffffff",
          };
        default:
          return {
            ...baseStyle,
            backgroundColor: "#ffffff",
            borderColor: "#d1d5db",
            color: "#000000",
          };
      }
    };

    const cellStyle = getCellStyle();
    const { transform, ...cellContainerStyle } = cellStyle;

    return (
      <div key={`${rowIndex}-${colIndex}`} style={cellContainerStyle}>
        <div
          style={{
            transform: transform,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {letter}
        </div>
      </div>
    );
  };

  // Get keyboard button style
  const getKeyStyle = (letter: string): React.CSSProperties => {
    const state = letterStates[letter];
    if (state === "correct") {
      return { backgroundColor: "#6aab64", color: "#ffffff" };
    }
    if (state === "present") {
      return { backgroundColor: "#cab458", color: "#ffffff" };
    }
    if (state === "absent") {
      return { backgroundColor: "#787c7e", color: "#ffffff" };
    }
    return { backgroundColor: "#d4d6da", color: "#000000" };
  };

  // Reset game
  const resetGame = () => {
    const randomWord =
      words[Math.floor(Math.random() * words.length)].toUpperCase();
    setTargetWord(randomWord);
    setGuesses([]);
    setCurrentGuess("");
    setGameState("playing");
    setLetterStates({});
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
            No-Wordle
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gjett det norske ordet!
          </p>
        </div>

        {/* Invalid Word Messages */}
        {invalidWordMessages.map((message, index) => (
          <div
            key={message.id}
            className="fixed left-1/2 transform -translate-x-1/2 z-50"
            style={{
              top: `${5 + index * 3.5}rem`,
              backgroundColor: "#000000",
              color: "#ffffff",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: "500",
              opacity: message.fadeOut ? 0 : 1,
              transition: "opacity 0.3s ease-out",
              pointerEvents: "none",
            }}
          >
            Ikke et ord
          </div>
        ))}

        {/* Game State Message */}
        {gameState === "won" && (
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
              Gratulerer! Du gjettet ordet!
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

        {/* Game Grid */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex gap-1 justify-center"
              style={{ width: "100%", overflow: "visible" }}
            >
              {Array.from({ length: WORD_LENGTH }).map((_, colIndex) =>
                renderCell(guesses[rowIndex]?.[colIndex], rowIndex, colIndex)
              )}
            </div>
          ))}
        </div>

        {/* Virtual Keyboard */}
        <div className="space-y-2">
          {keyboardRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 justify-center">
              {row.map((key) => {
                const isSpecial = key === "ENTER" || key === "BACKSPACE";
                return (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    style={{
                      paddingLeft: "1.25rem",
                      paddingRight: "1.25rem",
                      fontSize: isSpecial ? "1.125rem" : "1.5rem",
                      height: "3.5rem",
                      fontWeight: "600",
                      borderRadius: "0.375rem",
                      transition: "all 0.2s",
                      ...(key === "ENTER" || key === "BACKSPACE"
                        ? { backgroundColor: "#787c7e", color: "#ffffff" }
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
                    {key === "BACKSPACE" ? "⌫" : key}
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
