import os
import sys
import unittest


if __name__ == "__main__":
    # Add project root to PYTHONPATH
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

    # Create testing environment to load appropriate config
    os.environ["FLASK_ENV"] = "testing"

    # Run tests
    tests = unittest.TestLoader().discover("tests")
    result = unittest.TextTestRunner(verbosity=2).run(tests)
    exit(not result.wasSuccessful())
