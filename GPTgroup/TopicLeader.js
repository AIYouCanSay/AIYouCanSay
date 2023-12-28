/************************************************************************************************************************/
/*dependencies preparation*/
require('dotenv/config'); // environment variables access
const {Client, IntentsBitField} = require('discord.js'); // Discord access
const OpenAIApi = require('openai'); // OpenAI access
/************************************************************************************************************************/

/************************************************************************************************************************/
/*helper function: truncate reply*/
function truncateReply(reply, maxLength = 1800) {
    return reply.length > maxLength ? reply.substring(0, maxLength) + '... (message truncated due to length)' : reply;
};
/************************************************************************************************************************/

/************************************************************************************************************************/
/*change bots channel here if you design a new scenario*/
/*bot category*/
const channel_number = {
    [process.env.CHANNEL_ID_BUSINESS]: new Set([
        process.env.BOT_ID_MARKETING, process.env.BOT_ID_LEGAL, process.env.BOT_ID_FINANCIAL, process.env.BOT_ID_SUPPLY
    ]),
    [process.env.CHANNEL_ID_EXERCISE]: new Set([
        process.env.BOT_ID_PHYSICAL, process.env.BOT_ID_PSYCHIATRIST, process.env.BOT_ID_NUTRITIONIST, process.env.BOT_ID_COACH
    ]),
};
/************************************************************************************************************************/

/************************************************************************************************************************/
/*host bot setup*/
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds, // server access
        IntentsBitField.Flags.GuildMessages, // server message
        IntentsBitField.Flags.MessageContent, // message content
    ],
});

/*login notification*/
client.on('ready', () => {
    console.log('The Topic Leader is online!');
});
/*LLM connection*/
const openai = new OpenAIApi({
    apiKey: process.env.API_KEY,
});

/*host prompt*/
// the host bot does not reply to users' questions, it will
//      1. frame the questions from users, and make it best for other chatbots to answer
//      2. mention chatbots in the corresponding channel and send them modified questions
const prompt_host = `I'm a context chatbot. My job is to understand the question from users \
and generate background information based on this question. I will state the context in no more than 3 sentences.`;
/*common prompt*/
// the host bot can also play a common bot role to answer users' questions in other channels
const prompt_common = `I'm a neutral chatbot. I will answer questions in no more than 10 sentences`;
/************************************************************************************************************************/

/************************************************************************************************************************/
/*host bot function*/
client.on('messageCreate', async (message) => {
    // if message not from users -> no actions
    if (message.author.bot) return;
    let conversationLog_host = [{ role: 'system', content: prompt_host }, { role: 'user', content: message.content }];
    let conversationLog_common = [{ role: 'system', content: prompt_common }, { role: 'user', content: message.content }];

    // if not mentioned by users -> no action
    if (message.mentions.has(client.user)) {
        await message.channel.sendTyping();

        // message length control module
        try {
            /*host bot functioning pattern*/
            // the host will modify questions and mention corresponding bots instead of answering users's questions
            // the host will function in politics, academic and business channels
            if (channel_number.hasOwnProperty(message.channel.id)) {
                const result_host = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages: conversationLog_host });
                // modify questions
                let botReplyContent_host = truncateReply(result_host.choices[0].message.content);
                // find bots in a specific channel
                let name_list = ``;
                channel_number[message.channel.id].forEach(botid => {
                    name_list += `<@${botid}>`
                });
                const mentionRegex = /<@!?(\d+)>/;
                message_host = botReplyContent_host + ' ' + name_list + ' ' + message.content.replace(mentionRegex, '').trim();
                // mention corresponding bots
                message.channel.send(message_host);
            }
            /*common bot functioning pattern*/
            // the host will reply to users' questions instead of mentioning other chatbots
            // the host will function in other channels
            else {
                const result_common = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages: conversationLog_common });
                // answer questions
                let botReplyContent_common = truncateReply(result_common.choices[0].message.content);
                // reply to users
                message.reply(botReplyContent_common);
            }
        } catch (error) {
            console.error("Error in generating reply: ", error);
            message.reply("Sorry, I encountered an issue on generating a response.");
        }
    }
});

/*start to use*/
client.login(process.env.TOKEN_LEADER);
/************************************************************************************************************************/