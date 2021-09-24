import os
from MyLists import app
import ast

if __name__ == "__main__":
    app.run(debug=ast.literal_eval(os.environ.get('FLASK_DEBUG')))
