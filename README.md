Game creation


## Game creation
p1->game:create  {gameId, p1Id}
s->*game:created {gameId, p1Id, p2Id}

***Display sharable link***

p2:game:join {gameId, playerId}
s->*game:full {gameId, playerId}
s->*game:full {gameId, playerId}

s->*player:joined {gameId, p1Id, p2Id}

***Hide link / show player joined***
p1->player:ready {playerId, characterId}
p2->player:ready {playerId, characterId}

s->*game:ready


## Fight

player:move {}
player:attack {}
player:block {}
player:die {}