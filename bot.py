from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes
import os

# Get the token from environment variable or use the one from the example
TOKEN = ('')

# The URL to your deployed application
# Use your actual deployment URL here once you have deployed the application
APP_URL = 

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send a welcome message with a button to launch the card game."""
    user_id = update.message.from_user.id
    user_name = update.message.from_user.first_name

    # Create an inline keyboard with a button to launch the WebApp
    keyboard = [[
        InlineKeyboardButton(
            "Играть в карточную игру!",
            web_app={"url": f"{APP_URL}?user_id={user_id}"}
        )
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    # Send welcome message with the button
    await update.message.reply_text(
        f"Приветствую, {user_name}! Готов покорить мир карточных сражений?",
        reply_markup=reply_markup
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send a message when the command /help is issued."""
    help_text = (
        "🎮 *Карточная игра в Telegram* 🎮\n\n"
        "Команды:\n"
        "/start - Запустить игру\n"
        "/help - Показать это сообщение\n\n"
        "Правила игры:\n"
        "- Разыгрывайте карты, тратя ману\n"
        "- Атакуйте карты противника или его героя\n"
        "- Побеждайте, уменьшив здоровье вражеского героя до 0\n\n"
        "Удачи в сражениях!"
    )
    await update.message.reply_text(help_text, parse_mode="Markdown")

def main():
    """Start the bot."""
    # Create the Application and pass it your bot's token
    application = Application.builder().token(TOKEN).build()

    # Add command handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))

    # Run the bot until the user presses Ctrl-C
    application.run_polling()

if __name__ == "__main__":
    main()
