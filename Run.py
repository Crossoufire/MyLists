"""
Main script to start MyLists
"""

import os
from MyLists import app
import ast

if __name__ == "__main__":
    try:
        debug = ast.literal_eval(os.environ.get('FLASK_DEBUG'))
    except:
        debug = True
    app.run(debug=debug)
