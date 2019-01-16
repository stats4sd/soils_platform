const fs = require('fs');
const csv=require('csvtojson')
const mysql = require('mysql2/promise');
const lodash = require('lodash');
const XLSX = require('xlsx');

exports.query = async function (sql){

        try {
            connection = await pool.getConnection();
            result = await connection.query(sql)
        }
        catch(err) {
            throw err;
        }
        finally {
            console.log("finally, releasing");
            await connection.release();
            return result[0];
        }
    };



//Cleaning name columns from space white, uppercase and accents
exports.clean = function (object){
        Object.keys(object).forEach(function(key){
            var newkey = key.trim()
                newkey = newkey.toLowerCase();
                newkey = lodash.deburr(newkey);
                if(key !== newkey){
                    object[newkey] = object[key];
                    delete object[key];
                };
        });
    };


//converts datas to json format
exports.to_json = function (workbook){
        var result = {};
        workbook.SheetNames.forEach(function(sheetName){
            var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            if(roa.length > 0){
                result[sheetName] = roa;
            }
        });
        return result;
    };
   
exports.corrispForm = async function (connection,titleFile){
        const forms = await query("SELECT * FROM xls_forms;")
        console.log("forms from query = ", forms);
        const id = getFormIDByName(forms,titleFile)
        console.log("corrispForm ", id)
        return id
    };

//Checks if the form title is in the database and return form id and true if exists.
exports.getFormIDByName = function (forms,titleFile){
        const matchingForms = forms.filter( (form, index) => {
         
            return titleFile == form["form_title"];
           
        });
        //console.log('matching form',matchingForms[0].id)
        console.log("matchingForms " ,matchingForms.length)
        if(matchingForms.length == 0){
            return null
        }else {
            return matchingForms[0].id;    
        }
    };  

    //Delete the old version of the form from form_id. 
exports.deleteFormDb = async function (id){        
        const delResponse = await query("DELETE FROM xls_form_questions WHERE form_id="+ id +";")
        return id;
    }

