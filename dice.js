// dice.js
// encapsulates dice state and rolling logic no UI 

export class Die{
    /**@param {number} [value=1] initial face value*/
constructor(value = 1) {
    this.value = this.#clamp(value);
    this.held = false; // future: UI can toggle this
}


/** Roll this die. returns new value */
roll(){
    if (this.held) return this.value;
    this.value = 1 + Math.floor(Math.random()*6);
    return this.value;
}

/**Force set-value (validation kept for tests/dev) */

setValue(v){
    this.value = this.#clamp(v);
}

/** Toggle hold state */
toggleHold() {this.held = !this.held; }

#clamp(v) {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 1 || n > 6) return 1; 
    return Math.trunc(n);
}
}

export class DiceSet{
    /**@param {number} count number of dice in play (Yatzy = 5) */
    constructor(count = 5){
        this.count = Math.max(1, Math.trunc(count));
        this.dice = Array.from({length: this.count }, () => new Die());
      
        this.rollsThisTurn = 0; //track rolls per turn (Yatzy typically allows 3)
    }
    
    rollAll(){
        this.dice.forEach(d => d.roll());
        this.rollsThisTurn++;
        return this.values();
    }

    resetTurn(){
        this.dice.forEach(d => (d.held = false));
        this.count.rollsThisTurn = 0;
    }

    /** @returns {number[]} current values snapshot */
    values() {return this.dice.map(d => d.value);}
    
    
    setValues(vals){
        vals.slice(0, this.count).forEach((v, i) => this.dice[i].setValue(v));
    }
}

export default DiceSet; 
