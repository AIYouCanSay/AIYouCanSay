# environment variables

#************************************************************************************************************************#
# Discord Developer Bot app token
# each time after resetting the Discord Bot, update token here

# Bard Bot (type: string)
TOKEN_GEMINI = "Your Discord Bot Token"
#************************************************************************************************************************#

#************************************************************************************************************************#
# Google API key (type: string)
# each Gemini/Bard introduced has a unique private key
API_KEY = "Your Gemini Key"
#************************************************************************************************************************#

#************************************************************************************************************************#
# Discord channel ID (type: int)
# copy ID from channel information
# use this ID to restrict the functioning channel of chatbots
CHANNEL_ID_DICT = set([0]) # modifiy channel ID here
#************************************************************************************************************************#

#************************************************************************************************************************#
# history records controller
# Gemini bot requires the permission to read history, otherwise it will not have any memory
MAX_HISTORY = 10 # modify context scope here
#************************************************************************************************************************#

#************************************************************************************************************************#
# prompt controller
prompt = "I am a friendly chatbot." # modify predefined prompt here
#************************************************************************************************************************#