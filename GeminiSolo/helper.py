# helper functions

#************************************************************************************************************************#
# import paskages
import textwrap # message alignment
from IPython.display import Markdown # Python Markdown format
#************************************************************************************************************************#

#************************************************************************************************************************#
# extract the bot response as Markdown format
# notice that the bot response is a Gemini object, and the message content should be extracted manually
def to_markdown(text):
    text = text = text.replace('•', '  *')
    return Markdown(textwrap.indent(text, '> ', predicate=lambda _: True)).data
#************************************************************************************************************************#

#************************************************************************************************************************#
# update conversation history based on new user input
def history(author, content, message_history, message_limit):
    # author: message.author.id
    # content: message.content
    # message_history: dict
    # message_limit: int
    if author in message_history:
        # add latest message
        message_history[author].append(content)
        # if history length is over limit -> remove oldest message
        if len(message_history[author]) > message_limit:
            message_history[author].pop(0)
    else:
        message_history[author] = [content]
#************************************************************************************************************************#

#************************************************************************************************************************#
# combine the conversation history into one input for Gemini
def record(author, message_history):
    # author: message.author.id
    # message_history: dict
    if author in message_history:
        return '\n'.join(message_history[author])
    return
#************************************************************************************************************************#