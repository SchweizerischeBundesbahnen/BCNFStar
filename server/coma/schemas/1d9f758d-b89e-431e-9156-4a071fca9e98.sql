CREATE TABLE [links.auftrag] (
a_auftragkey integer NOT NULL,
kunde integer NOT NULL,
bezahlstatus varchar(1) NOT NULL,
umsatz numeric(15,2) NOT NULL);

CREATE TABLE [links.fahrt] (
auftrag_id integer NOT NULL,
id integer NOT NULL,
gewicht numeric(15,2) NOT NULL,
tag date NOT NULL,
startort varchar(25) NOT NULL,
zielort varchar(10) NOT NULL);

