import numpy as np
import tkinter as tk
from tkinter import messagebox
from typing import Tuple, Optional

class ConnectFourGUI:
    def __init__(self):
        self.window = tk.Tk()
        self.window.title("Connect Four")
        
        # Modern color scheme
        self.COLORS = {
            'background': '#2C3E50',  # Dark blue-gray
            'board': '#34495E',       # Lighter blue-gray
            'empty': '#ECF0F1',       # Light gray
            'player': '#E74C3C',      # Red
            'ai': '#F1C40F'          # Yellow
        }
        
        # Configure window
        screen_width = self.window.winfo_screenwidth()
        screen_height = self.window.winfo_screenheight()
        self.window.geometry(f"{screen_width}x{screen_height}")
        self.window.configure(bg=self.COLORS['background'])
        
        self.CELL_SIZE = 80  # Increased cell size
        self.game = ConnectFour()
        self.ai = ConnectFourAI(self.game)
        
        # Calculate game dimensions
        game_width = self.game.cols * self.CELL_SIZE
        game_height = (self.game.rows + 1) * self.CELL_SIZE
        
        # Create main frame with fixed size
        self.main_frame = tk.Frame(
            self.window,
            width=game_width + 40,  # Add padding
            height=game_height + 40,
            bg=self.COLORS['background']
        )
        self.main_frame.place(relx=0.5, rely=0.5, anchor='center')
        self.main_frame.pack_propagate(False)  # Prevent frame from shrinking
        
        # Create canvas
        self.canvas = tk.Canvas(
            self.main_frame, 
            width=game_width,
            height=game_height,
            bg=self.COLORS['board'],
            highlightthickness=0  # Remove canvas border
        )
        self.canvas.place(relx=0.5, rely=0.5, anchor='center')

        # Create modern-looking buttons for each column
        self.buttons = []
        for col in range(self.game.cols):
            button = tk.Button(
                self.window,
                text="↓",
                font=('Arial', 16, 'bold'),
                command=lambda c=col: self.human_move(c),
                bg=self.COLORS['board'],
                fg=self.COLORS['empty'],
                activebackground=self.COLORS['board'],
                activeforeground=self.COLORS['player'],
                relief='flat',
                width=2
            )
            self.canvas.create_window(
                col * self.CELL_SIZE + self.CELL_SIZE//2,
                self.CELL_SIZE//2,
                window=button
            )
            self.buttons.append(button)

        self.draw_board()

    def draw_board(self):
        """Draws the current state of the board"""
        for row in range(self.game.rows):
            for col in range(self.game.cols):
                x1 = col * self.CELL_SIZE
                y1 = (row + 1) * self.CELL_SIZE
                x2 = (col + 1) * self.CELL_SIZE
                y2 = (row + 2) * self.CELL_SIZE
                
                # Draw cell background
                self.canvas.create_rectangle(
                    x1, y1, x2, y2,
                    fill=self.COLORS['board'],
                    outline=self.COLORS['board']
                )
                
                # Draw piece
                piece = self.game.board[row][col]
                color = self.COLORS['empty']
                if piece == 1:
                    color = self.COLORS['player']
                elif piece == 2:
                    color = self.COLORS['ai']
                
                # Draw circle with shadow effect
                padding = 8
                # Shadow
                self.canvas.create_oval(
                    x1 + padding + 2, y1 + padding + 2,
                    x2 - padding + 2, y2 - padding + 2,
                    fill='#1a1a1a',  # Dark gray for shadow
                    outline=''
                )
                # Main circle
                self.canvas.create_oval(
                    x1 + padding, y1 + padding,
                    x2 - padding, y2 - padding,
                    fill=color,
                    outline=''
                )
        
        self.window.update()

    def human_move(self, col):
        """Handle human player move"""
        if self.game.is_valid_move(col):
            self.game.drop_piece(col)
            self.draw_board()
            
            if self.check_game_over():
                return
                
            # AI turn
            self.window.after(500, self.ai_move)  # Delay AI move for better UX
        else:
            messagebox.showwarning("Invalid Move", "This column is full!")

    def ai_move(self):
        """Handle AI player move"""
        self.game.player = 2
        ai_col = self.ai.get_best_move(depth=5)  # Increased from 4 to 5
        self.game.drop_piece(ai_col)
        self.draw_board()
        
        if not self.check_game_over():
            self.game.player = 1

    def check_game_over(self) -> bool:
        """Check if game is over and show appropriate message"""
        winner = self.game.check_winner()
        if winner:
            winner_text = "You won!" if winner == 1 else "AI won!"
            self.game_over(winner_text)
            return True
        elif self.game.is_board_full():
            self.game_over("It's a tie!")
            return True
        return False

    def game_over(self, message):
        """Handle game over state"""
        messagebox.showinfo("Game Over", message, parent=self.window)
        if messagebox.askyesno("Play Again?", "Would you like to play again?", parent=self.window):
            self.game = ConnectFour()
            self.ai = ConnectFourAI(self.game)
            self.draw_board()
        else:
            self.window.quit()

    def run(self):
        """Start the game"""
        self.window.mainloop()

# Original Connect Four and AI classes remain the same
class ConnectFour:
    def __init__(self, rows=6, cols=7):
        self.rows = rows
        self.cols = cols
        self.board = np.zeros((rows, cols), dtype=int)
        self.player = 1  # 1 for human, 2 for AI
        
    def drop_piece(self, col: int) -> bool:
        """Drops a piece in the specified column. Returns True if successful."""
        for row in range(self.rows-1, -1, -1):
            if self.board[row][col] == 0:
                self.board[row][col] = self.player
                return True
        return False
    
    def is_valid_move(self, col: int) -> bool:
        """Checks if a move is valid."""
        return col >= 0 and col < self.cols and self.board[0][col] == 0
    
    def get_valid_moves(self) -> list:
        """Returns list of valid column moves."""
        return [col for col in range(self.cols) if self.is_valid_move(col)]
    
    def check_winner(self) -> Optional[int]:
        """Checks for a winner. Returns player number or None."""
        # Check horizontal
        for row in range(self.rows):
            for col in range(self.cols-3):
                if (self.board[row][col] != 0 and 
                    self.board[row][col] == self.board[row][col+1] == 
                    self.board[row][col+2] == self.board[row][col+3]):
                    return self.board[row][col]
        
        # Check vertical
        for row in range(self.rows-3):
            for col in range(self.cols):
                if (self.board[row][col] != 0 and 
                    self.board[row][col] == self.board[row+1][col] == 
                    self.board[row+2][col] == self.board[row+3][col]):
                    return self.board[row][col]
        
        # Check diagonal (positive slope)
        for row in range(self.rows-3):
            for col in range(self.cols-3):
                if (self.board[row][col] != 0 and 
                    self.board[row][col] == self.board[row+1][col+1] == 
                    self.board[row+2][col+2] == self.board[row+3][col+3]):
                    return self.board[row][col]
        
        # Check diagonal (negative slope)
        for row in range(3, self.rows):
            for col in range(self.cols-3):
                if (self.board[row][col] != 0 and 
                    self.board[row][col] == self.board[row-1][col+1] == 
                    self.board[row-2][col+2] == self.board[row-3][col+3]):
                    return self.board[row][col]
        
        return None
    
    def is_board_full(self) -> bool:
        """Checks if the board is full."""
        return len(self.get_valid_moves()) == 0

class ConnectFourAI:
    def __init__(self, game: ConnectFour):
        self.game = game
        
    def evaluate_window(self, window: list, piece: int) -> int:
        """Evaluates a window of 4 positions."""
        score = 0
        opp_piece = 1 if piece == 2 else 2

        # Winning move gets highest priority
        if window.count(piece) == 4:
            score += 10000000
        # Block opponent's immediate win
        elif window.count(opp_piece) == 3 and window.count(0) == 1:
            score -= 5000000
        # Create winning threat
        elif window.count(piece) == 3 and window.count(0) == 1:
            score += 1000000
        # Block opponent's build-up of 2 pieces
        elif window.count(opp_piece) == 2 and window.count(0) == 2:
            score -= 800
        # Build towards a win with 2 pieces
        elif window.count(piece) == 2 and window.count(0) == 2:
            score += 1000
        # Single pieces with space
        elif window.count(piece) == 1 and window.count(0) == 3:
            score += 100

        return score

    def score_position(self, board: np.ndarray, piece: int) -> int:
        """Scores the entire board position."""
        score = 0
        
        # Increased weight for center control
        center_array = [int(i) for i in list(board[:, self.game.cols//2])]
        center_count = center_array.count(piece)
        score += center_count * 2000

        # Prioritize lower positions
        for r in range(self.game.rows):
            row_weight = (self.game.rows - r) * 100  # Higher weight for lower rows
            row_array = [int(i) for i in list(board[r,:])]
            piece_count = row_array.count(piece)
            score += piece_count * row_weight

        # Score horizontal
        for r in range(self.game.rows):
            row_array = [int(i) for i in list(board[r,:])]
            for c in range(self.game.cols-3):
                window = row_array[c:c+4]
                score += self.evaluate_window(window, piece)

        # Score vertical
        for c in range(self.game.cols):
            col_array = [int(i) for i in list(board[:,c])]
            for r in range(self.game.rows-3):
                window = col_array[r:r+4]
                score += self.evaluate_window(window, piece)

        # Score diagonal
        for r in range(self.game.rows-3):
            for c in range(self.game.cols-3):
                window = [board[r+i][c+i] for i in range(4)]
                score += self.evaluate_window(window, piece)

        for r in range(self.game.rows-3):
            for c in range(self.game.cols-3):
                window = [board[r+3-i][c+i] for i in range(4)]
                score += self.evaluate_window(window, piece)

        return score

    def minimax(self, board: np.ndarray, depth: int, alpha: float, beta: float, maximizing_player: bool) -> Tuple[int, int]:
        """Minimax algorithm with alpha-beta pruning."""
        valid_moves = self.game.get_valid_moves()
        is_terminal = self.game.check_winner() is not None or self.game.is_board_full()
        
        if depth == 0 or is_terminal:
            if is_terminal:
                winner = self.game.check_winner()
                if winner == 2:
                    return (None, 100000000000000)
                elif winner == 1:
                    return (None, -100000000000000)
                else:  # Game is over, no more valid moves
                    return (None, 0)
            else:  # Depth is zero
                return (None, self.score_position(board, 2))
        
        if maximizing_player:
            value = float('-inf')
            column = valid_moves[0] if valid_moves else None
            for col in valid_moves:
                # Find the first empty row in this column
                row = None
                for r in range(self.game.rows-1, -1, -1):
                    if board[r][col] == 0:
                        row = r
                        break
                if row is None:
                    continue
                
                temp_board = board.copy()
                temp_board[row][col] = 2
                new_score = self.minimax(temp_board, depth-1, alpha, beta, False)[1]
                if new_score > value:
                    value = new_score
                    column = col
                alpha = max(alpha, value)
                if alpha >= beta:
                    break
            return column, value
        
        else:  # Minimizing player
            value = float('inf')
            column = valid_moves[0] if valid_moves else None
            for col in valid_moves:
                # Find the first empty row in this column
                row = None
                for r in range(self.game.rows-1, -1, -1):
                    if board[r][col] == 0:
                        row = r
                        break
                if row is None:
                    continue
                
                temp_board = board.copy()
                temp_board[row][col] = 1
                new_score = self.minimax(temp_board, depth-1, alpha, beta, True)[1]
                if new_score < value:
                    value = new_score
                    column = col
                beta = min(beta, value)
                if alpha >= beta:
                    break
            return column, value

    def get_best_move(self, depth=4) -> int:
        """Returns the best move for the AI."""
        col, _ = self.minimax(self.game.board, depth, float('-inf'), float('inf'), True)
        return col

if __name__ == "__main__":
    game = ConnectFourGUI()
    game.run()