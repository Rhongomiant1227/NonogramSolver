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

    def test_mouse_operations_validate_and_execute(self):
        ops = app.validate_mouse_operations([
            {'x': 12.4, 'y': 30.6, 'button': 'left'},
            {'x': -5, 'y': 8, 'button': 'right'},
        ])
        self.assertEqual(ops, [(12, 31, 'left'), (-5, 8, 'right')])
        with self.assertRaises(ValueError): app.validate_mouse_operations([{'x': 0, 'y': 0, 'button': 'middle'}])
        with self.assertRaises(ValueError): app.validate_mouse_operations([{'x': 10001, 'y': 0, 'button': 'left'}])

        class FakeUser32:
            def __init__(self): self.calls=[]
            def SetCursorPos(self, x, y): self.calls.append(('move', x, y))
            def mouse_event(self, event, *_): self.calls.append(('event', event))
        fake=FakeUser32(); app.execute_mouse_operations(ops, fake, sleep=lambda _: None)
        self.assertEqual(fake.calls, [
            ('move', 12, 31), ('event', 0x0002), ('event', 0x0004),
            ('move', -5, 8), ('event', 0x0008), ('event', 0x0010),
        ])

if __name__ == '__main__':
    unittest.main(verbosity=2)
