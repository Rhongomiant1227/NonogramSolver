import itertools
import unittest
import app

def clues(bits):
    out, run = [], 0
    for bit in bits:
        if bit: run += 1
        elif run: out.append(run); run = 0
    if run: out.append(run)
    return tuple(out)

def signature(grid):
    h, w = len(grid), len(grid[0])
    return (tuple(clues(row) for row in grid), tuple(clues([grid[r][c] for r in range(h)]) for c in range(w)))

class SolverTests(unittest.TestCase):
    def test_small_boards_exhaustive(self):
        for h, w in ((1, 1), (2, 3), (3, 3)):
            clue_groups = {}
            for bits in itertools.product((False, True), repeat=h*w):
                grid = [list(bits[r*w:(r+1)*w]) for r in range(h)]
                clue_groups.setdefault(signature(grid), []).append(grid)
            for (rows, cols), expected in clue_groups.items():
                result = app.solve([list(x) for x in rows], [list(x) for x in cols])
                self.assertEqual(result['status'], 'unique' if len(expected) == 1 else 'multiple')
                self.assertEqual(signature(result['grid']), (rows, cols))

    def test_contradiction_and_multi_solution(self):
        self.assertEqual(app.solve([[2], [1]], [[1], [1]])['status'], 'unsat')
        self.assertEqual(app.solve([[1], [1]], [[1], [1]])['status'], 'multiple')

if __name__ == '__main__':
    unittest.main(verbosity=2)
