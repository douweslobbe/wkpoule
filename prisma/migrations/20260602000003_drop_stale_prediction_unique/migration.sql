-- De app gebruikt @@unique([userId, matchId, poolId]) — één voorspelling per
-- wedstrijd PER POOL. In productie bestond echter nog de oude unieke constraint
-- op alleen (userId, matchId), waardoor dezelfde wedstrijd in een tweede pool
-- voorspellen crashte met P2002. Verwijder die stale constraint definitief.
--
-- Bulletproof opgezet: de named DROP kan niet falen (IF EXISTS), en het
-- introspectie-vangnet zit in een DO-block met EXCEPTION-handler, zodat deze
-- migratie nooit de deploy kan blokkeren.

-- 1. Verwijder op de Prisma-standaardnaam (dropt constraint + backing index)
ALTER TABLE "Prediction" DROP CONSTRAINT IF EXISTS "Prediction_userId_matchId_key";

-- 2. Vangnet: verwijder elke overgebleven UNIEKE constraint die exact
--    (userId, matchId) afdekt, ongeacht de naam. De gewenste
--    (userId, matchId, poolId)-constraint (3 kolommen) blijft staan.
DO $$
DECLARE
  c text;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = '"Prediction"'::regclass
      AND con.contype = 'u'
      AND array_length(con.conkey, 1) = 2
      AND (
        SELECT array_agg(att.attname::text ORDER BY att.attname::text)
        FROM unnest(con.conkey) AS k(attnum)
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
      ) = ARRAY['matchId','userId']
  LOOP
    EXECUTE format('ALTER TABLE "Prediction" DROP CONSTRAINT %I', c);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  -- Nooit de migratie laten falen op het vangnet; de named DROP hierboven
  -- doet in de praktijk al het werk.
  NULL;
END $$;
