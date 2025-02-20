import React, { useState } from 'react';

function RandomInput() {
    const [text, setText] = useState('');

    function generateRandomString () {
        let randomNumber = '';
        for (let i = 0; i < 4; i++) {
            randomNumber += Math.floor(Math.random() * 10);
        }
        setText(randomNumber);
    };

    return (<div>
        <input 
            type="text" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
        />
        <button onClick={generateRandomString}>랜덤 4자리 숫자 생성</button>
        <button onClick={() => alert(text)}>글자 확인</button>
    </div>)
}

export default RandomInput;