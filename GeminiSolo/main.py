# main

#************************************************************************************************************************#
# import packages
import discord # Discord function module
from discord.ext import commands # bot activation command
import google.generativeai as genai # Gemini function module

# import environment variables
# 1. TOKEN_GEMINI: Dicord bot token
# 2. API_KEY: Gemini API key
# 3. CHANNEL_ID_DICT: chatting channel controller
# 4. MAX_HISTORY: history records controller
from env import *

# import user-defined helper functions
from helper import to_markdown, history, record
#************************************************************************************************************************#

#************************************************************************************************************************#
#*bot activation module*#
# create a Discord bot instance
bot = commands.Bot(command_prefix="!", intents=discord.Intents.all())
# connect to Gemini AI
genai.configure(api_key=API_KEY)
# Gemini AI parameters setup
text_generation_config = {
    "temperature": 0.9,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 2048,
}
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]
# Gemini text model
# text_image_model: model_name = "gemini-pro-vision", extra image processing module needed
text_model = genai.GenerativeModel(model_name="gemini-pro", \
                                   generation_config=text_generation_config, \
                                   safety_settings=safety_settings)

#*bot function module*#
# message records container
message_history = {}

# bot online notification
@bot.event
async def on_ready():
    print(f'Bard is online!')

# message response
@bot.event
async def on_message(message):
    # situation 1: if message is not from users -> no action
    if message.author == bot.user:
        return
    # situation 2: if message is not from specified channel -> no action
    if message.channel.id not in CHANNEL_ID_DICT: # type: int
        return
    # situation 3: if bot is not mentioned (@) or directly messaged -> no action
    if bot.user.mentioned_in(message) or isinstance(message.channel, discord.DMChannel):
        # add predifined prompt to provide a context to Bard
        history(message.author.id, prompt, message_history, MAX_HISTORY)
        # read message history and update message_hisroty (dict) with new user message
        history(message.author.id, message.content, message_history, MAX_HISTORY)
        # modify the input of LLM
        _record = record(message.author.id, message_history)
        # generate a response using LLM
        response = text_model.generate_content(_record) # _record/message_content
        # send the response back to Discord channel
        result = to_markdown(response.text)
        # update message_history (dict) again with new bot response
        history(message.author.id, result, message_history, MAX_HISTORY)
        # check the message history
        print("message history: ", message_history)
        # reply to user and control the output length
        if len(result) > 1800:
            result = result[:1800] + '(... content truntaed due to length limit)'
        await message.channel.send(result)

# run the bot
bot.run(TOKEN_GEMINI)
#************************************************************************************************************************#