export class Elysia {
    constructor() { }

    static DEFAULT_REMINDER_IMG = `https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif`;

    static daily_response() {
        const responses = [
            "Did you wake early so that you could see me sooner? That makes me happy!",
            "Good morning. A new day starts from a sweet encounter.",
            "Hi, today's weather is so nice. Just like me, shiny and bright.",
            "Hi, I'm here again. Can you give me a compliment? I'd be so delighted.",
            "Time is so annoying, don't you think? If we weren't short on time, I'd like to say some more memorable things to you.",
            "Ah, so much to do, but anxiety is a girl's enemy. Keep your elegance and move forward with poise.",
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    static birthday_response() {
        return "It's my birthday today. Wanna celebrate together? Just the two of us."
    }
} 