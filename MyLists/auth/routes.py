"""
Auth routes
"""

from datetime import datetime
from typing import Any
from flask import Blueprint, flash, request, redirect, url_for, render_template
from flask_login import login_user, current_user, logout_user, login_required
from MyLists import app, bcrypt, db
from MyLists.auth.forms import LoginForm, RegistrationForm, ResetPasswordRequestForm, ResetPasswordForm
from MyLists.auth.functions import check_if_auth, send_register_email, send_reset_email
from MyLists.models import User


bp = Blueprint('auth', __name__)


@bp.route("/", methods=['GET', 'POST'])
@check_if_auth
def home():
    """ Homepage route """

    # Get forms
    login_form = LoginForm()
    register_form = RegistrationForm()

    # Check forms
    if login_form.validate_on_submit():
        user = User.query.filter_by(username=login_form.login_username.data.strip()).first()
        if user and not user.active:
            app.logger.info(f"[INFO] - [{user.id}] Connexion attempt while account not activated")
            flash("Your account is not activated. Please check your emails to activate your account.", "danger")
        elif user and bcrypt.check_password_hash(user.password, login_form.login_password.data):
            login_user(user, remember=login_form.login_remember.data)
            app.logger.info(f"[INFO] - [{user.id}] Logged in.")
            next_page = request.args.get("next")

            return redirect(next_page or url_for("users.account", username=user.username))
        else:
            flash("Login failed. Please check the username and password.", "warning")
    elif register_form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(register_form.register_password.data).decode('utf-8')

        # noinspection PyArgumentList
        user = User(username=register_form.register_username.data.strip(),
                    email=register_form.register_email.data,
                    password=hashed_password,
                    registered_on=datetime.utcnow())
        db.session.add(user)

        # Commit changes
        db.session.commit()

        # Add info to logger
        app.logger.info(f"[INFO] - [{user.id}] New account registration: "
                        f"Username: {register_form.register_username.data.strip()}, "
                        f"email: {register_form.register_email.data}")
        try:
            send_register_email(user)
            flash("Your account has been created. Check your email address to activate your account.", "info")
        except Exception as e:
            app.logger.error(f"[ERROR] - Sending register email to account [{user.id}]: {e}.")
            flash("An error occured while sending your register email. Admin were advised. Please try again later.")
        return redirect(url_for("auth.home"))

    return render_template('home.html', login_form=login_form, register_form=register_form)


@bp.route("/logout", methods=['GET'])
@login_required
def logout():
    """ Log out route """

    # Add log info
    app.logger.info(f"[INFO] - [{current_user.id}] Logged out")

    # Logout user
    logout_user()

    return redirect(url_for("auth.home"))


@bp.route("/reset_password", methods=['GET', 'POST'])
@check_if_auth
def reset_password():
    """ Reset password route """

    # Get form
    form = ResetPasswordRequestForm()

    # Check form
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        try:
            send_reset_email(user)
            app.logger.info(f"[INFO] - [{user.id}] Reset password email sent")
            flash("An email has been sent with the instructions to reset your password.", "info")
        except Exception as e:
            app.logger.error(f"[ERROR] - Failed sending reset password email to [{user.email}]: {e}")
            flash("An error occured while sending the reset password email. Admin were advised. "
                  "Please try again later.")
        return redirect(url_for("auth.home"))

    return render_template('reset_password.html', title='Reset password', form=form)


@bp.route("/reset_password/<token>", methods=['GET', 'POST'])
@check_if_auth
def reset_password_token(token: Any):
    """ Reset password using the token route """

    # Check user toker
    user = User.verify_token(token)

    if user is None:
        flash("This is an invalid or an expired token.", "warning")
        return redirect(url_for("auth.reset_password"))

    # Fetch form
    form = ResetPasswordForm()

    # Check form
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        user.password = hashed_password
        db.session.commit()
        app.logger.info(f"[INFO] - [{user.id}] Password reset via the reset password email.")
        flash("Your password has been updated! You are now able to log in.", "success")
        return redirect(url_for("auth.home"))

    return render_template("reset_password_token.html", title="Reset password", form=form)


@bp.route("/register_account/<token>", methods=['GET'])
@check_if_auth
def register_account_token(token: Any):
    """ Register the account using the token """

    # Check user token
    user = User.verify_token(token)

    # Check if user active
    if not user or user.active:
        flash("This is an invalid or an expired token.", "warning")
        return redirect(url_for("auth.reset_password"))

    # Add information
    user.active = True
    user.activated_on = datetime.utcnow()

    # Commit changes
    db.session.commit()

    # Log info
    app.logger.info(f"[INFO] - [{user.id}] Account activated")
    flash("Your account has been activated.", "success")

    return redirect(url_for('auth.home'))
