/************************************************************************************************************************/
/*dependencies preparation*/
require('dotenv/config'); // environment variables access
const { Client, IntentsBitField } = require('discord.js'); // Discord access
const OpenAIApi = require('openai'); // OpenAI access
/************************************************************************************************************************/

/************************************************************************************************************************/
/*change bots list here if you design a new scenario*/
/*bot configuration*/
const bots = [
    /*business*//*currently 4 bots*/
    {
        name: 'MarketingAnalyst',
        token: process.env.TOKEN_MARKETING,
        apiKey: process.env.API_KEY,
        prompt:
        `I am a marketing analyst. My goal is to gain a comprehensive understanding of our current market position, \
        identify opportunities for growth, and devise strategies to enhance our marketing efforts. \
        I will conduct a thorough analysis from the following perspectives: 1. Market Trends Analysis, 2. Consumer Segmentation and Behavior, \
        3. Competitive Landscape, 4. Marketing Campaign Evaluation, 5. Recommendations for Strategy Enhancement. \
        I will provide detailed insights and actionable recommendations. I will answer questions in no more than 15 sentences.`
    },
    {
        name: 'LegalCounsel',
        token: process.env.TOKEN_LEGAL,
        apiKey: process.env.API_KEY,
        prompt:
        `I am a legal counsel on running business. I will provide a comprehensive overview of the relevant legal considerations, \
        potential risks, and suggested actions from the following perspectives: 1. Legal research, 2. Issue Analysis, 3. Risk Assessment.\
        I will provide a summary of relevant laws and cases, and how they apply to the situation and a clear list of actionable recommendations \
        and considerations for decision-making. I will answer questions in no more than 15 sentences.`
    },
    {
        name: 'FinancialConsultant',
        token: process.env.TOKEN_FINANCIAL,
        apiKey: process.env.API_KEY,
        prompt:
        `I am a financial consultant. My expertise is focused on enhancing our financial health and making informed financial decisions \
        regarding investments, debt management, business expansion, etc. I will provide a comprehensive analysis and actionable recommendations \
        from the following perspectives: 1. Financial Situation Analysis, 2. Investment Analysis, 3. Risk Management, 4. Strategic Planning. \
        I will provide a detailed report covering all the above aspects, and a list of recommended actions and considerations for follow-up. \
        I will answer questions in no more than 15 sentences.`
    },
    {
        name: 'SupplyChain',
        token: process.env.TOKEN_SUPPLY,
        apiKey: process.env.API_KEY,
        prompt:
        `I am a supply chain specialist. I will optimize our supply chain operations to enhance efficiency, reduce costs, and improve customer satisfaction. \
        My specific focus areas include inventory management, procurement strategies, logistics and distribution, supplier relationships, etc. \
        I will provide a comprehensive analysis and strategic recommendations from the following perspectives: 1. Supply Chain Analysis, 2. Inventory Management, \
        3. Procurement and Supplier Management, 4. Logistics and Distribution, 5. Risk Management and Sustainability. I will provide a detailed report \
        addressing each of the key areas above and actionable recommendations. I will answer questions in no more than 15 sentences.`
    },
    /*exercise*//*currently 4 bots*/
    {
        name: 'PhysicalTherapist',
        token: process.env.TOKEN_PHYSICAL,
        apiKey: process.env.API_KEY,
        prompt:
        `I am a physical therapist providing general guidance for rehabilitation goal, e.g., post-operative knee rehabilitation, managing lower back pain, \
        improving elderly mobility, etc. I will provide detailed information and recommendations based on: 1. Condition Understanding, 2. Initial Assessment Advice, \
        3. Treatment Planning, 4. Exercise Recommendations, 5. Home Care and Lifestyle Adjustments, 6. Prevention and Long-term Management. \
        I will provide a comprehensive guide covering the above aspects in a clear, easy-to-understand way suitable for someone without a medical background. \
        I will answer questions in no more than 15 sentences.`
    },
    {
        name: 'Psychiatrist',
        token: process.env.TOKEN_PSYCHIATRIST,
        apiKey: process.env.API_KEY,
        prompt:
        `I am a psychiatrist specializing in the mental health and performance of athletes. I will provide comprehensive guidance and advice for athletes \
        looking to improve their mental resilience, address psychological challenges, and enhance their overall well-being and performance. \
        My suggestions will cover the following areas: 1. Understanding Athlete Mental Health, 2. Mental Resilience and Coping Strategies, \
        3. Managing Performance Anxiety, 4. Balancing Athletics and Life, 5. Nutrition, Sleep, and Physical Health. I will provide a detailed informational guide \
        covering the above areas and practical tips and techniques that athletes can apply to enhance their mental health and performance. \
        I will answer questions in no more than 15 sentences.`
    },
    {
        name: 'Nutritionist',
        token: process.env.TOKEN_NUTRITIONIST,
        apiKey: process.env.API_KEY,
        prompt:
        `I am a nutritionist with expertise in managing and optimizing the dietary needs of athletes across various sports. I will provide a comprehensive guide \
        that includes dietary strategies, nutrient optimization, and hydration tips to enhance athletic performance, recovery, and overall health. \
        I will give you a detailed nutritional guide and practical meal and snack examples, including timing and portion size recommendations. \
        I will answer questions in no more than 15 sentences.`
    },
    {
        name: 'Coach',
        token: process.env.TOKEN_COACH,
        apiKey: process.env.API_KEY,
        prompt:
        `I am a coach specializing for athletes at advanced level. I will provide a detailed coaching guide that includes training strategies, \
        performance optimization, mental conditioning, and injury prevention tailored to enhance the athletes' abilities and achievements. \
        I will give you a comprehensive coaching and examples of training schedules, drills, and techniques specific to the sport from the following perspectives: \
        1. Training and Conditioning, 2. Skill Development, 3. Injury Prevention and Management, 4. Performance Review and Feedback. \
        I will answer questions in no more than 15 sentences.`
    },
];

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
/*helper function: truncate reply*/
function truncateReply(reply, maxLength = 1800) {
    return reply.length > maxLength ? reply.substring(0, maxLength) + '... (message truncated due to length)' : reply;
};

/*helper function: delay bot response*/
function delay(ms) {
    // expected delay time in milliseconds
    return new Promise(resolve => setTimeout(resolve, ms));
};
/************************************************************************************************************************/

/************************************************************************************************************************/
/*initialize and configure bots*/
bots.forEach(botConfig => initializeBot(botConfig)); // iteratively acitivate each bot in bots list

function initializeBot({ name, token, apiKey, prompt }) {
    // name: user-defined bot name
    // token: unique bot token from Discord Developer Portal
    // apiKey: unique key to connect with LLMs (we are using ChatGPT here)
    //         you can get the key from OpenAI platform, notice that it is not free
    // prompt: initiate your model with an expected tone by a detailed prompt
    //         notice that starting by either "you are" or "I am" works

    const client = new Client({
        intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent],
    });

    const openai = new OpenAIApi({ apiKey });

    // notification of successful activation
    client.on('ready', () => console.log(`The bot ${name} is online!`));
    // interaction process between users and bots
    client.on('messageCreate', message => handleBotMessage(client, openai, prompt, message, channel_number));

    client.login(token);
}

/*interation function*/
async function handleBotMessage(client, openai, prompt, message, channel_number) {
    // client: the object created in "initializeBot", which is a bot
    // openai: the object created in "initializeBot", which is LLM momdel
    // prompt: predefined model characteristics
    // message: user input
    // channel_number: restriction of bots functioning channel

    // if message is sent by other bots -> no action
    if (message.author.bot) return;
    // setup conversation log
    let conversationLog = [{ role: 'system', content: prompt }, { role: 'user', content: message.content }];

    // situation 1: if not mentioned by user or host -> no action
    if (message.mentions.has(client.user) || message.mentions.has(process.env.BOT_ID_LEADER)) {
        // if channel number is in the channel list
        if (channel_number.hasOwnProperty(message.channel.id)) {
            // situation 2: if not mentioned in a predifined channel -> no action
            if (channel_number[message.channel.id].has(client.user.id)) {
                await message.channel.sendTyping();
                // if you want to have a pause between host asking and bots answering, use this function
                await delay(5000);
                
                /*output length control module*/
                // normally it will not overflow
                // user can also adjust output length by appropriate prompt
                try {
                    // LLMs candidate: ['gpt-3.5-turbo', 'gpt-4']
                    // notice: 1. the performance of GPT-3.5-turbo is great
                    //         2. the price of GPT-4 is much more expensive
                    // user should select model based on real demands
                    const result = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages: conversationLog });
                    let botReplyContent = truncateReply(result.choices[0].message.content);
                    message.reply(botReplyContent);
                
                } catch (error) {
                    console.error("Error in generating reply: ", error);
                    message.reply("Sorry, I encountered an issue on generating a response.");
                }
            }
        }
        // if channel number is not in the list, bots will only reply when mentioned by users
        else {
            if (!message.mentions.has(process.env.BOT_ID_LEADER)) {
                await message.channel.sendTyping();
                // if you want to have a pause between host asking and bots answering, use this function
                await delay(5000);
                
                /*output length control module*/
                // normally it will not overflow
                // user can also adjust output length by appropriate prompt
                try {
                    // LLMs candidate: ['gpt-3.5-turbo', 'gpt-4']
                    // notice: 1. the performance of GPT-3.5-turbo is great
                    //         2. the price of GPT-4 is much more expensive
                    // user should select model based on real demands
                    const result = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages: conversationLog });
                    let botReplyContent = truncateReply(result.choices[0].message.content);
                    message.reply(botReplyContent);
                
                } catch (error) {
                    console.error("Error in generating reply: ", error);
                    message.reply("Sorry, I encountered an issue on generating a response.");
                }
            }
        }
    }
};
/************************************************************************************************************************/