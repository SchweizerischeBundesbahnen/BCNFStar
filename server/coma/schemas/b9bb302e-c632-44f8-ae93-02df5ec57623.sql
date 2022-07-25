CREATE TABLE [rechts.fahrt] (
auftrag_nr integer NOT NULL,
loktyp_nr integer NOT NULL,
nr integer NOT NULL,
datum date NOT NULL,
von varchar(25) NOT NULL,
nach varchar(10) NOT NULL,
kunde integer NOT NULL,
preis numeric(15,2) NOT NULL);

CREATE TABLE [rechts.loktyp] (
nr integer NOT NULL,
hersteller varchar(25) NOT NULL,
geschwindigkeit integer NOT NULL,
zugkraft numeric(15,2) NOT NULL);

