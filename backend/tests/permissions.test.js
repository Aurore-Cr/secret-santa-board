import test from 'node:test';
import assert from 'node:assert/strict';
// Test pédagogique des invariants de confidentialité ; compléter par tests HTTP d’intégration.
test('un invité ne consulte que sa propre liste',()=>{
 const mayView=(role,viewerId,ownerId)=>role!=='guest'||viewerId===ownerId;
 assert.equal(mayView('guest',9,1),false);
 assert.equal(mayView('guest',9,9),true);
});
test('le propriétaire ne peut pas réserver son propre cadeau',()=>{
 const mayReserve=(role,viewerId,ownerId)=>role!=='guest'&&viewerId!==ownerId;
 assert.equal(mayReserve('family',1,1),false);
 assert.equal(mayReserve('family',2,1),true);
 assert.equal(mayReserve('guest',9,1),false);
});
