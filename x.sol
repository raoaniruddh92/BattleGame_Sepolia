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
        uint256 public gameStartTime;
    uint256 public constant TIMEOUT_DURATION = 1 hours; // Or appropriate timeout
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
address public gameCreator;
uint256 public gameCount;

modifier onlyCreator() {
    require(msg.sender == gameCreator, "Only creator can reset");
    _;
}

constructor(address _player1, address _player2) {
    gameCreator = msg.sender;
        availableWeapons.push(Weapon("Sword", 10, 3));
    availableWeapons.push(Weapon("Axe", 15, 5));
    availableWeapons.push(Weapon("Spear", 8, 2));
    availableWeapons.push(Weapon("Dagger", 5, 1));
    
    initializeGame(_player1, _player2);
        gameStartTime = block.timestamp;

}
function cancelGameTimeout() public {
    require(block.timestamp > gameStartTime + TIMEOUT_DURATION, "Timeout not reached");
    require(!combatPhaseStarted, "Combat already started");
    gameEnded = true;
    // Optionally emit a GameCancelled event
}

    // --- Function to Choose a Weapon (unchanged) ---
bool public combatPhaseStarted = false;
function chooseWeapon(uint _weaponIndex) public {
    require(msg.sender == player1 || msg.sender == player2, "Not a valid player");
    require(!combatPhaseStarted, "Combat already started");
    require(!player[msg.sender].chosen_weapon, "Weapon already chosen");
    require(_weaponIndex < availableWeapons.length, "Invalid weapon index");
    
    // Apply weapon stats
    Weapon memory selectedWeapon = availableWeapons[_weaponIndex];
    playerWeaponIndex[msg.sender] = _weaponIndex;
    
    // Deduct armor cost for equipping the weapon
    if (player[msg.sender].armor >= selectedWeapon.armorCost) {
        player[msg.sender].armor -= selectedWeapon.armorCost;
    } else {
        player[msg.sender].armor = 0;
    }
    
    player[msg.sender].chosen_weapon = true;
}
function startCombat() public {
    require(msg.sender == player1 || msg.sender == player2, "Only players can start combat");
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
    require(combatPhaseStarted, "Combat not started");
    require(msg.sender == currentTurn, "Not your turn");
    
    healthpotionbalance[msg.sender] -= 1;
    player[msg.sender].health += 4;
    
    // Switch turn after using potion
    currentTurn = (msg.sender == player1) ? player2 : player1;
}

function use_armor_potion() public {
    require(armorreplenish[msg.sender] > 0, "No armor potions available");
    require(player[msg.sender].isalive, "Player is dead");
    require(msg.sender == player1 || msg.sender == player2, "Not a valid player");
    require(!gameEnded, "Game has ended");
    require(msg.sender == currentTurn, "Not your turn");

    armorreplenish[msg.sender] -= 1;
    player[msg.sender].armor += 4;
    currentTurn = (msg.sender == player1) ? player2 : player1;

}


function initializeGame(address _player1, address _player2) private {
    require(_player1 != address(0) && _player2 != address(0));
    require(_player1 != _player2);
    
    player[_player1] = stats(100, 10, true, false);
    player[_player2] = stats(100, 10, true, false);
    
    player1 = _player1;
    player2 = _player2;
    currentTurn = _player1;
    gameEnded = false;
    combatPhaseStarted = false;
    
    healthpotionbalance[_player1] = 3;
    healthpotionbalance[_player2] = 3;
    armorreplenish[_player1] = 2;
    armorreplenish[_player2] = 2;
    
    playerWeaponIndex[_player1] = 0;
    playerWeaponIndex[_player2] = 0;
    
    gameCount++;
}

function resetGame() public onlyCreator {
    require(gameEnded, "Current game not finished");
    initializeGame(player1, player2);
}
    // --- Events (Highly recommended for smart contract interaction) ---
    event WinnerAnnounced(address winner);
    event AttackExecuted(address attacker, address defender, uint damageDealt, uint defenderHealthRemaining);
}