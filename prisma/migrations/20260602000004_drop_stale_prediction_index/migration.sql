-- De (userId, matchId)-uniciteit op Prediction blijkt afgedwongen door een
-- unieke INDEX (geen constraint). De vorige migratie dropte alleen constraints
-- en miste deze index, waardoor P2002 bleef optreden bij voorspellen in
-- meerdere pools. Verwijder de index nu. De gewenste 3-koloms unique op
-- (userId, matchId, poolId) blijft staan.
--
-- Bulletproof: named DROP INDEX IF EXISTS (kan niet falen) + introspectie-
-- vangnet in een DO-block met EXCEPTION-handler.

-- 1. Verwijder op de Prisma-standaardnaam
DROP INDEX IF EXISTS "Prediction_userId_matchId_key";

-- 2. Vangnet: drop elke UNIEKE index op exact (userId, matchId), ongeacht naam.
DO $$
DECLARE
  i text;
BEGIN
  FOR i IN
    SELECT idx.relname
    FROM pg_index ix
    JOIN pg_class idx ON idx.oid = ix.indexrelid
    WHERE ix.indrelid = '"Prediction"'::regclass
      AND ix.indisunique
      AND NOT ix.indisprimary
      AND (
        SELECT array_agg(a.attname::text ORDER BY a.attname::text)
        FROM pg_attribute a
        WHERE a.attrelid = ix.indrelid
          AND a.attnum = ANY (string_to_array(ix.indkey::text, ' ')::smallint[])
      ) = ARRAY['matchId','userId']
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I', i);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
