//generarete a random lyric from the lyrics array 
function getRandomLyric() {
    const lyrics = [
        "Is this the real life? Is this just fantasy?",
        "I see a little silhouetto of a man",
        "We don't need no education",
        "Hello from the other side",
        "Cause baby you're a firework",
        "Just a small town girl",
        "I'm on the highway to hell",
        "I want to hold your hand",
        "Hit me baby one more time",
        "I'm a survivor, I'm not gonna give up", 
        "Sweet dreams are made of this", 
        "I will always love you",
        "You are my fire, the one desire",
        "I kissed a girl and I liked it",
        "It's a beautiful day, don't let it get away",
        "All I wanted a black grand national, f being rational", 
        "I'm sorry, Ms. Jackson, I am for real",
        "Is it too late now to say sorry?",
        "A tornado flew around my room before you came",
        "Tryna strike a chord and it's probably a minor", 
        "Come on Superman, say your stupid line",
        "I drink till I'm drunk, smoke till I'm high",
        "Jump in the Cadillac (Girl puts some miles on it)", 
        "Never had much faith in love or miracles", 
        "I know you're somewhere out there, somewhere far away",
        "Hey there Delilah, what's it like in New York City?", 
        "I though I was dreaming till you said you loved me",
        "MF DOOM is like D.P Cooper",
        "Feel like a brand new person but you'll make the same old mistakes",
        "Everybody wants to rule the world",
        "If Pirus and Crips all got along",
        "This may be the night that my dreams might let me know",
        "Take me out tonight, where there's music and there's people",
        "Because, boys don't cry",
        "Call me when you want, call me when you need me",
        "Four years no calls, and you're looking pretty in a hotel bar",
        "Load up on guns, bring your friends",
        "I hear Jerusalem bells are ringing, Roman Cavalry choirs are singing", 
    ];
    const randomIndex = Math.floor(Math.random() * lyrics.length);
    return lyrics[randomIndex];
}

    
