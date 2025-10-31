#  Yatzy —  Dice Game  Assignment 1

**Scope:** Full implementation using HTML, CSS, and JavaScript ES Modules.

----------

## 1. Overview

This project is a **single-player version of Yatzy**, the classic dice game.  
The player rolls five dice, can hold selected ones, and has up to **three rolls per turn**.  
Each turn, the player must choose one scoring category; after all categories are filled, the game ends and displays the final score.

----------

## 2. Features

Feature

Description

 **Dice Rolling**

Roll up to 3 times per turn using 5 dice.

 **Hold Dice**

Click dice to toggle _Hold_ between rolls.

 **Scoring System**

Includes 13 standard Yatzy categories (Ones–Sixes, Full House, Yatzy, etc.).

 **Automatic Totals**

Calculates subtotal, bonus (+35 if ≥63), and total automatically.

 **Single Player**

Tracks one player for 13 rounds.

 **End Game Summary**

Displays final score and winner alert.

**Clear Holds**

Resets all held dice mid-turn.

----------

## 3. Project Structure

`yatzy/
├── index.html # Game interface and scorecard layout ├── styles.css # Visual design, dice faces, layout, and responsiveness ├── app.js # DOM integration and user interaction ├── dice.js # Die and DiceSet classes for rolling and holding ├── yatzyEngine.js # Scoring logic and category rules └── yatzyGame.js # Turn and round management` 

----------

## 4. How to Run

Because this app uses **ES Modules (`type="module"`)**, it must run on a local server.

### VS Code Live Server

1.  Open the `yatzy/` folder in VS Code.
    
2.  Right-click `index.html` → **Open with Live Server**.
    

----------

## 5. Design System

###  Color Palette

Variable

Hex

Description

`--color-primary`

`#1E3A8A`

Deep blue for headers and main actions.

`--color-secondary`

`#F59E0B`

Gold for highlights and “Hold” badges.

`--color-accent`

`#10B981`

Green accent for success or scoring actions.

`--color-bg`

`#F8FAFC`

Neutral background.

`--color-surface`

`#FFFFFF`

White card backgrounds.

`--color-text`

`#111827`

Primary dark text color.

`--color-muted`

`#6B7280`

Used for hints and labels.

### Typography

-   **Headings:** [Poppins](https://fonts.google.com/specimen/Poppins) (600–700)
    
-   **Body:** [Inter](https://fonts.google.com/specimen/Inter) (400–600)
    

----------

## 6. Game Logic Breakdown

### `dice.js`

Defines two classes:

-   **`Die`** — Holds a single die’s value (1–6) and `held` state.
    
-   **`DiceSet`** — Contains 5 dice, tracks roll count per turn, and includes:
    
    -   `rollAll()` — rolls all unheld dice.
        
    -   `resetTurn()` — clears holds and resets roll counter.
        
    -   `values()` — returns the current face values as an array.
        

### `yatzyEngine.js`

Implements the scoring rules.

**Categories:**

`ONES, TWOS, THREES, FOURS, FIVES, SIXES, THREE_KIND, FOUR_KIND, FULL_HOUSE, SMALL_STRAIGHT, LARGE_STRAIGHT, CHANCE, YATZY` 

**Fixed Scores:**

-   Full House → 25
    
-   Small Straight → 30
    
-   Large Straight → 40
    
-   Yatzy → 50
    

**Key Methods:**

-   `calculateScore(category, diceValues)` — computes score for a given category.
    
-   `assignScore(category, diceValues)` — locks in the score and marks category as used.
    
-   `upperBonus()` — +35 if upper subtotal ≥63.
    
-   `total()` — adds upper subtotal, bonus, and lower subtotal.
    

### `yatzyGame.js`

Handles game rounds and flow.

-   `startNewGame()` — resets player and dice state.
    
-   `roll()` — rolls the dice if within limit.
    
-   `scoreSelection(category)` — applies score via `YatzyEngine`.
    
-   `endTurn()` — advances round and resets dice for next turn.
    
-   `endGame()` — finalizes scores and shows winner alert.
    

### `app.js`

Connects logic to the HTML interface.

-   Handles **clicks** on dice to toggle hold states.
    
-   Updates **scorecard cells** with scores after category selection.
    
-   Controls **buttons** (Roll, Clear Holds, Score).
    
-   Displays **game status** (rounds, rolls, and messages).
    
-   Alerts the player when the game ends.
    

----------

##  7. Scoring Reference

Category

Rule

Points

Ones – Sixes

Sum of dice with that face

Variable

Three of a Kind

≥3 same dice → sum all dice

Sum

Four of a Kind

≥4 same dice → sum all dice

Sum

Full House

3 of a kind + 2 of a kind

25

Small Straight

Sequence of 4 (e.g., 1–2–3–4)

30

Large Straight

Sequence of 5 (e.g., 2–3–4–5–6)

40

Chance

Any combination

Sum

Yatzy

All dice same

50

**Upper Bonus**

Upper subtotal ≥63

+35

----------

## 8. Accessibility & Responsiveness

-   Uses semantic HTML (`<header>`, `<section>`, `<aside>`, `<table>`).
    
-   `aria-pressed` and `aria-disabled` improve screen reader compatibility.
    
-   Layout adapts to screen width:
    

Screen

Layout

Desktop ≥980px

Two-column layout (Board + Scorecard)

Tablet <980px

Single-column layout

Mobile <600px

Dice shrink to 88px, arranged in 2 columns

----------



## 9. Future Enhancements

-   Add dice roll animations
    
-   Multi-player support
    
-   LocalStorage save/resume system
    
-   Sound effects
    
-   Theme toggle (light/dark)
    
-   Better detection logic for straights and full houses
    

----------
