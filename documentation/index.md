# BCNFStar

The tool consists basically of two essential pages:  

1. The [start page](start_page.md)
2. The [schema editing page](schema_editing_page.md)  

The first one allows you to import tables from a database that you have previously connected to the tool (see [Setup](../README.md)). Furthermore you can run different data profiling algorithms to detect functional or inclusion dependencies (see [Metanome](./start_page/metanome.md)).  

The second one allows you to manipulate the imported tables using the calculated meta data (see [Sidebar](./schema_editing_page/sidebar.md)). Different operations such as splitting using a functional dependency, joining using a detected inclusion dependency, unioning etc. are supported. Finally, you can export the schema or create an SQL file which you can run on your database to persist the transformation you have made.  
