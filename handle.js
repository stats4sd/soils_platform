const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const csv=require('csvtojson')
const request=require('request');
const d3 = require('d3-dsv');
const mysql = require('mysql2/promise');
//const mysql = require('mysql')
const math = require('mathjs');
const iconv = require('iconv-js');
const config = require('./config');
const JSON = require('JSON');
const lodash = require('lodash');
const XLSX = require('xlsx');
//const xlsx = require('node-xlsx');
const path = require('path');
const os = require('os');
//const Busboy = require('busboy');
const helpers = require('./helpers.js')
const db = require('./db.js');



exports.handle = async function (path) {

    console.log("HANDLING FILE", path)
    // start file processing here... 
    var workbook = XLSX.readFile(path);
    //takes title of the form from file xlsx 
    var worksheet = workbook.Sheets['settings'];
    var cell = worksheet['A2'];
    let titleFile = cell.v;

    parsedData = helpers.to_json(workbook);

    var pool;

    if(!pool){
        try {
             pool = db.con_db;
        }
        catch(err) {
            console.log("error in dbPool making");
            //throw err;
        }
    }

    //Checks if the version is new or not from form title.
    const exist = await helpers.corrispForm(pool,titleFile)

 
    if(exist==null){
        pool.getConnection((err, pool) =>{
            if (err) throw err;

             parsedData['settings'].map((item, index) =>{
                console.log(parsedData['settings'])
                var newItem = {};
                newItem['form_title'] = item['form_title'];
                newItem['form_id'] = item['form_id'];
                newItem['version'] = item['version'];
                newItem['instance_name'] = item['instance_name'];
                newItem['default_language'] = 'english';

                             return newItem

            });    
                   
        

        });

        await insertToTable(parsedData['settings'], pool, 'xls_forms'); 


      }
    

    /**

     * Inserts multiple rows into the main database table;

     * @param  {array}  parsedData            Array of JSON objects containing the data to insert
     * @param  {object} pool                  The database connection pool (using mysql2)
     * @param  {string} tableName             Name of table to insert in the database
     * @return {na}     Does not return anything yet. Should be edited to return number of inserted rows.

     */
    async function insertToTable(parsedData, pool, tableName ){

    console.log("setting up db connection");
    var connection;
    console.log("inserting into table");

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        var count = 0;
        for(const row of parsedData){
            count++
            console.log("count = ", count);
            const connnection = await pool.getConnection();
            await connection.query('INSERT INTO '+tableName+' SET ?;', row)
        }

        console.log("committing");
        await connection.commit();

    }



    catch(err) {

        console.log("rolling back");

        await connection.rollback();

        throw err;

    }



    finally {

        console.log("finally, releasing");

        await connection.release();

    }

    }




    console.log(parsedData['survey']);

    parsedData['survey'].forEach(function(row){
        helpers.clean(row);
    });



    //Identify the form in database return form_id

    const form_id = await helpers.corrispForm(pool, titleFile);
    console.log("form_id ", form_id);
    await helpers.deleteFormDb(form_id);
    
    //Adds form_id column in parsedData.
    parsedData['survey'] = parsedData['survey'].map( (item, index) => {      
        item["form_id"] = form_id;
        return item
    })

    //Uploads datas in the corrisponding columns 
    pool.getConnection((err, connection) => {
        if (err) throw err;
        parsedData['survey'] = parsedData['survey'].map( (item, index) => {
            var newItem = {}
            newItem['type'] = item['type'];
            newItem['name'] = item['name'];
            newItem['hint::english'] = item['hint::english'];
            newItem['relevant'] =item['relevant'];
            newItem['constraint'] = item['constraint']; 
            newItem['constraint_message::english'] = item['constraint_message::english'];
            newItem['required'] = item['required'];
            newItem['required_message::english'] = item['required_message::english'];
            newItem['appearance'] = item['appearance'];
            newItem['default'] = item['default'];
            newItem['calculation'] = item['calculation'];
            newItem['count'] = item['count'];
            newItem['label::english'] = item['label::english'];
            newItem['form_id'] = item['form_id'];
            newItem['label::espanol'] = item['label::espanol'];
            newItem['hint::espanol'] = item['hint::espanol'];
            newItem['label'] = item['label'];
            newItem['hint'] = item['hint'];
  
        });

        return newItem;


    });  

   
    await insertToTable(parsedData['survey'], pool, 'xls_form_questions');



    
  

}
