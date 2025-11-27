// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.14;

contract battle{
    // --- Existing Structures ---
    struct stats{
        uint health;
        uint armor;
        bool isalive;
        bool chosen_weapon;
    }
    mapping (address => stats) public player;
    
    // --- New Weapon Structure ---
    struct Weapon {
        string name;
        uint damageBonus; // How much extra damage the weapon gives
        uint armorCost;   // How much armor the player loses to equip it
    }
    mapping (address=> uint) healthpotionbalance;
    mapping (address=> uint) armorreplenish;

    // --- State Variables ---
    address public player1;
    address public player2;
    address public currentTurn; // Tracks whose turn it is
    bool public gameEnded = false;
    
    // List of available weapons
    Weapon[] public availableWeapons;
    
    // Mapping to track which weapon a player currently has equipped
    mapping (address => uint) public playerWeaponIndex; 

    // --- Constructor (Modified to include Weapon setup) ---
    constructor(address _player1, address _player2) {
        require(_player1 != address(0), "Player1 cannot be zero address");
        require(_player2 != address(0), "Player2 cannot be zero address");
        require(_player1 != _player2, "Players must be different");
        
        // Initialize Player 1 stats
        player[_player1] = stats(100, 10, true,false);
        
        // Initialize Player 2 stats
        player[_player2] = stats(100, 10, true,false);
        
        player1 = _player1;
        player2 = _player2;
        currentTurn = _player1; // Player 1 starts the game
        
        // Populate the list of available weapons
        availableWeapons.push(Weapon("Fists", 0, 0));       
        availableWeapons.push(Weapon("Dagger", 5, 2));      
        availableWeapons.push(Weapon("Sword", 10, 5));      
        availableWeapons.push(Weapon("Great Axe", 20, 8));
           healthpotionbalance[_player1] = 3; // Give each player 3 health potions
    healthpotionbalance[_player2] = 3;
    armorreplenish[_player1] = 2; // Give each player 2 armor potions
    armorreplenish[_player2] = 2;
    }

    // --- Function to Choose a Weapon (unchanged) ---
    function chooseWeapon(uint _weaponIndex) public {
        if (!player[msg.sender].chosen_weapon){
        // 1. Input Validation
        require(!gameEnded, "Game has ended.");
        require(_weaponIndex < availableWeapons.length, "Invalid weapon index.");
        
        address currentPlayer = msg.sender;
        
        // Ensure only a valid player calls this
        require(currentPlayer == player1 || currentPlayer == player2, "Only players can choose a weapon.");
        
        Weapon storage chosenWeapon = availableWeapons[_weaponIndex];
        
        // Prevent negative armor
        require(player[currentPlayer].armor >= chosenWeapon.armorCost, "Insufficient armor to equip this weapon.");

        // 2. Apply the Trade-off (Armor Loss)
        player[currentPlayer].armor -= chosenWeapon.armorCost;
        
        // 3. Update the Player's Equipped Weapon
        playerWeaponIndex[currentPlayer] = _weaponIndex;
        player[msg.sender].chosen_weapon=true;
        }
        else{
            revert();
        }
    }
bool public combatPhaseStarted = false;

function startCombat() public {
    require(!combatPhaseStarted, "Combat already started");
    require(player[player1].chosen_weapon, "Player1 must choose weapon");
    require(player[player2].chosen_weapon, "Player2 must choose weapon");
    combatPhaseStarted = true;
}

    // -------------------------------------------------------------------
    // --- NEW: Attack Function Implementation ---
    // -------------------------------------------------------------------
    function attack() public {
        require(!gameEnded, "Game has ended. No more attacks.");
        require(combatPhaseStarted, "Combat phase not started");

        address attacker = msg.sender;
        
        // 1. Turn and Player Validation
        require(attacker == currentTurn, "Not your turn to attack.");
        require(player[attacker].isalive, "Attacker is not alive.");
        
        address defender;
        if (attacker == player1) {
            defender = player2;
        } else if (attacker == player2) {
            defender = player1;
        } else {
            revert("Only valid players can attack.");
        }
        
        // 2. Damage Calculation
        uint baseDamage = 15; // Set a default base damage
        uint weaponIndex = playerWeaponIndex[attacker];
        Weapon memory equippedWeapon = availableWeapons[weaponIndex];
        
        uint totalAttackDamage = baseDamage + equippedWeapon.damageBonus;
        
        // 3. Damage Absorption by Armor
        uint damageToAbsorb = player[defender].armor;
        uint damageDealt;

        // Armor absorbs damage up to its value
        if (totalAttackDamage > damageToAbsorb) {
            damageDealt = totalAttackDamage - damageToAbsorb;
            // Armor is consumed/reduced on hit (optional: you can choose not to reduce armor)
            player[defender].armor = 0; 
        } else {
            // Armor completely blocks the damage, but is still consumed
            player[defender].armor = player[defender].armor - totalAttackDamage;
            damageDealt = 0;
        }

        // 4. Health Update
        if (player[defender].health > damageDealt) {
            player[defender].health -= damageDealt;
        } else {
            // Defender is defeated
            player[defender].health = 0;
            player[defender].isalive = false;
            gameEnded = true; // End the game
            emit WinnerAnnounced(attacker); // Emit an event for the winner
        }
        
        // 5. Change Turn
        if (!gameEnded) {
            currentTurn = defender;
        }
    }
function use_health_potion() public {
    require(healthpotionbalance[msg.sender] > 0, "No health potions available");
    require(player[msg.sender].isalive, "Player is dead");
    require(msg.sender == player1 || msg.sender == player2, "Not a valid player");
    require(!gameEnded, "Game has ended");
    
    healthpotionbalance[msg.sender] -= 1;
    player[msg.sender].health += 4;
}

function use_armor_potion() public {
    require(armorreplenish[msg.sender] > 0, "No armor potions available");
    require(player[msg.sender].isalive, "Player is dead");
    require(msg.sender == player1 || msg.sender == player2, "Not a valid player");
    require(!gameEnded, "Game has ended");
    
    armorreplenish[msg.sender] -= 1;
    player[msg.sender].armor += 4;
}
    // --- Events (Highly recommended for smart contract interaction) ---
    event WinnerAnnounced(address winner);
    event AttackExecuted(address attacker, address defender, uint damageDealt, uint defenderHealthRemaining);
}